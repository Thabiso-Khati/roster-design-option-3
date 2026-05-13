"use client";
import { useEffect, useRef, useState } from "react";
import { Lock, Check, X, FileText, AlertCircle, Loader2, PenLine, Printer, Download } from "lucide-react";
import type { PublicSigningRequestView } from "@/lib/sign/types";

/**
 * Public signer page — /sign/[token]
 * No authentication required. Token-gated access.
 *
 * Three states: loading → review (read+sign+decline) → done (signed/declined/error)
 */
export default function SignPage({ params }: { params: Promise<{ token: string }> }) {
  const [token, setToken] = useState<string>("");
  const [state, setState] = useState<
    | { status: "loading" }
    | { status: "ready"; request: PublicSigningRequestView }
    | { status: "submitting" }
    | { status: "signed"; request: PublicSigningRequestView }
    | { status: "declined" }
    | { status: "error"; message: string }
  >({ status: "loading" });

  // Modal state
  const [showSignModal, setShowSignModal] = useState(false);
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [declineReason, setDeclineReason] = useState("");
  const [typedName, setTypedName] = useState("");

  // Signature canvas
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawingRef = useRef(false);
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);
  const [hasSignature, setHasSignature] = useState(false);

  // Resolve params
  useEffect(() => {
    params.then((p) => setToken(p.token));
  }, [params]);

  // Load request
  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/sign/${token}`);
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          setState({ status: "error", message: data.error || "Could not load contract" });
          return;
        }
        if (data.status === "signed") setState({ status: "signed", request: data });
        else if (data.status === "declined") setState({ status: "declined" });
        else setState({ status: "ready", request: data });
      } catch (e) {
        setState({ status: "error", message: e instanceof Error ? e.message : "Network error" });
      }
    })();
    return () => { cancelled = true; };
  }, [token]);

  // Canvas setup
  useEffect(() => {
    if (!showSignModal || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set high DPI
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#0F172A";
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, rect.width, rect.height);
  }, [showSignModal]);

  function getPos(e: React.MouseEvent | React.TouchEvent): { x: number; y: number } {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    if ("touches" in e) {
      const t = e.touches[0] || e.changedTouches[0];
      return { x: t.clientX - rect.left, y: t.clientY - rect.top };
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function startDraw(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault();
    drawingRef.current = true;
    lastPosRef.current = getPos(e);
  }

  function draw(e: React.MouseEvent | React.TouchEvent) {
    if (!drawingRef.current || !canvasRef.current) return;
    e.preventDefault();
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;
    const pos = getPos(e);
    const last = lastPosRef.current;
    if (last) {
      ctx.beginPath();
      ctx.moveTo(last.x, last.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    }
    lastPosRef.current = pos;
    setHasSignature(true);
  }

  function endDraw() {
    drawingRef.current = false;
    lastPosRef.current = null;
  }

  function clearSig() {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || !canvas) return;
    const rect = canvas.getBoundingClientRect();
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, rect.width, rect.height);
    setHasSignature(false);
  }

  async function handleSubmitSign() {
    if (!canvasRef.current || !hasSignature || !typedName.trim()) return;
    setState({ status: "submitting" });
    try {
      const sigData = canvasRef.current.toDataURL("image/png");
      const res = await fetch(`/api/sign/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signatureImageData: sigData, signatureTypedName: typedName.trim() }),
      });
      if (!res.ok) {
        const j = await res.json();
        setState({ status: "error", message: j.error || "Signing failed" });
        return;
      }
      // Re-fetch the now-signed request so we can render the signed view
      const refetched = await fetch(`/api/sign/${token}`);
      const refetchedData = await refetched.json();
      if (refetched.ok && refetchedData.status === "signed") {
        setState({ status: "signed", request: refetchedData });
      } else {
        // Fallback: synthesise the signed request from what we already have
        setState((prev) => {
          if (prev.status === "submitting" || prev.status === "ready") {
            const base = prev.status === "ready" ? prev.request : null;
            if (base) {
              return { status: "signed", request: { ...base, status: "signed", signedAt: new Date().toISOString(), signatureImageData: sigData, signatureTypedName: typedName.trim() } };
            }
          }
          return { status: "error", message: "Signed but unable to load confirmation. Please refresh." };
        });
      }
      setShowSignModal(false);
    } catch (e) {
      setState({ status: "error", message: e instanceof Error ? e.message : "Signing failed" });
    }
  }

  async function handleSubmitDecline() {
    setState({ status: "submitting" });
    try {
      const res = await fetch(`/api/sign/${token}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: declineReason.trim() }),
      });
      if (!res.ok) {
        const j = await res.json();
        setState({ status: "error", message: j.error || "Decline failed" });
        return;
      }
      setState({ status: "declined" });
      setShowDeclineModal(false);
    } catch (e) {
      setState({ status: "error", message: e instanceof Error ? e.message : "Decline failed" });
    }
  }

  // ── Render branches ─────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-bg text-text-primary py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: "rgba(201,168,76,0.15)" }}>
            <FileText size={20} style={{ color: "#C9A84C" }} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: "#C9A84C" }}>ROSTER · E-Signature</p>
            <p className="text-sm text-text-muted">Read carefully. Sign or decline below.</p>
          </div>
        </div>

        {state.status === "loading" && (
          <Centered>
            <Loader2 size={28} className="animate-spin text-text-muted" />
            <p className="text-sm text-text-muted mt-4">Loading contract…</p>
          </Centered>
        )}

        {state.status === "submitting" && (
          <Centered>
            <Loader2 size={28} className="animate-spin text-text-muted" />
            <p className="text-sm text-text-muted mt-4">Submitting…</p>
          </Centered>
        )}

        {state.status === "error" && (
          <div className="glass-card rounded-2xl p-8 flex items-start gap-3" style={{ borderColor: "#EF4444" }}>
            <AlertCircle size={20} className="text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-text-primary mb-1">Something went wrong</p>
              <p className="text-sm text-text-muted">{state.message}</p>
            </div>
          </div>
        )}

        {state.status === "signed" && (
          <SignedView request={state.request} />
        )}

        {state.status === "declined" && (
          <div className="glass-card rounded-2xl p-10 text-center" style={{ borderColor: "rgba(148,163,184,0.40)" }}>
            <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: "rgba(148,163,184,0.15)" }}>
              <X size={28} className="text-text-muted" />
            </div>
            <h1 className="text-2xl font-black text-text-primary mb-2">Signing declined.</h1>
            <p className="text-sm text-text-muted leading-relaxed max-w-md mx-auto">
              The sender has been notified that you declined to sign. You can close this window now.
            </p>
          </div>
        )}

        {state.status === "ready" && (
          <ReadyView
            request={state.request}
            onSign={() => setShowSignModal(true)}
            onDecline={() => setShowDeclineModal(true)}
          />
        )}
      </div>

      {/* Sign modal */}
      {showSignModal && (
        <Modal onClose={() => setShowSignModal(false)} title="Sign this contract">
          <p className="text-xs text-text-muted leading-relaxed mb-5">
            Draw your signature below. By signing, you confirm you've read the contract and agree to be bound by its terms. This electronic signature is legally binding.
          </p>

          <p className="text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: "#C9A84C" }}>Your signature</p>
          <div className="border-2 border-border rounded-lg overflow-hidden mb-3" style={{ touchAction: "none" }}>
            <canvas
              ref={canvasRef}
              style={{ display: "block", width: "100%", height: "180px", backgroundColor: "#FFFFFF", cursor: "crosshair" }}
              onMouseDown={startDraw}
              onMouseMove={draw}
              onMouseUp={endDraw}
              onMouseLeave={endDraw}
              onTouchStart={startDraw}
              onTouchMove={draw}
              onTouchEnd={endDraw}
            />
          </div>
          <button onClick={clearSig} className="text-xs text-text-muted hover:text-text-primary mb-5 inline-flex items-center gap-1">
            Clear signature
          </button>

          <p className="text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: "#C9A84C" }}>Type your full legal name</p>
          <input
            type="text"
            className="bg-transparent border border-border rounded-lg px-3 py-2.5 text-sm text-text-primary w-full focus:outline-none focus:border-brand mb-5"
            placeholder="Full legal name"
            value={typedName}
            onChange={(e) => setTypedName(e.target.value)}
          />

          <div className="flex items-center gap-2 justify-end">
            <button onClick={() => setShowSignModal(false)} className="text-sm font-semibold px-4 py-2 rounded-lg border border-border text-text-primary hover:bg-surface-2">
              Cancel
            </button>
            <button
              onClick={handleSubmitSign}
              disabled={!hasSignature || !typedName.trim()}
              className="text-sm font-semibold inline-flex items-center gap-1.5 px-4 py-2 rounded-lg disabled:opacity-50"
              style={{ backgroundColor: "#10B981", color: "white" }}
            >
              <Check size={14} /> Sign contract
            </button>
          </div>
        </Modal>
      )}

      {/* Decline modal */}
      {showDeclineModal && (
        <Modal onClose={() => setShowDeclineModal(false)} title="Decline to sign">
          <p className="text-xs text-text-muted leading-relaxed mb-5">
            The sender will be notified. You can optionally include a reason — useful for negotiation history but not required.
          </p>
          <p className="text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: "#C9A84C" }}>Reason (optional)</p>
          <textarea
            rows={4}
            className="bg-transparent border border-border rounded-lg px-3 py-2.5 text-sm text-text-primary w-full focus:outline-none focus:border-brand mb-5"
            placeholder="e.g. Need to discuss the term length and territory clauses before I can sign…"
            value={declineReason}
            onChange={(e) => setDeclineReason(e.target.value)}
          />
          <div className="flex items-center gap-2 justify-end">
            <button onClick={() => setShowDeclineModal(false)} className="text-sm font-semibold px-4 py-2 rounded-lg border border-border text-text-primary hover:bg-surface-2">
              Cancel
            </button>
            <button onClick={handleSubmitDecline} className="text-sm font-semibold inline-flex items-center gap-1.5 px-4 py-2 rounded-lg" style={{ backgroundColor: "#EF4444", color: "white" }}>
              <X size={14} /> Decline
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="glass-card rounded-2xl p-12 flex flex-col items-center justify-center">
      {children}
    </div>
  );
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="glass-card rounded-2xl p-6 max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <p className="font-bold text-text-primary text-base">{title}</p>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function ReadyView({
  request, onSign, onDecline,
}: {
  request: PublicSigningRequestView;
  onSign: () => void;
  onDecline: () => void;
}) {
  return (
    <>
      {/* Cover info */}
      <div className="glass-card rounded-2xl p-6 mb-6" style={{ borderColor: "rgba(201,168,76,0.30)" }}>
        <p className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: "#C9A84C" }}>{request.contractType}</p>
        <h1 className="text-2xl font-black text-text-primary mb-3">{request.contractTitle}</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-[10px] font-black uppercase text-text-muted mb-0.5">From</p>
            <p className="text-text-primary font-semibold">{request.requesterName}</p>
            <p className="text-xs text-text-muted">{request.requesterEmail}</p>
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-text-muted mb-0.5">To you</p>
            <p className="text-text-primary font-semibold">{request.recipientName}</p>
            <p className="text-xs text-text-muted">Expires {new Date(request.expiresAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</p>
          </div>
        </div>
      </div>

      {/* E-signature notice */}
      <div className="glass-card rounded-2xl p-4 mb-6 flex items-start gap-3" style={{ borderColor: "rgba(201,168,76,0.20)", backgroundColor: "rgba(201,168,76,0.04)" }}>
        <Lock size={14} className="text-text-muted flex-shrink-0 mt-0.5" />
        <p className="text-xs text-text-muted leading-relaxed">
          <span className="font-semibold text-text-primary">Legally binding.</span> Your electronic signature carries the same legal weight as a handwritten one under SA's ECTA Section 13 and Nigeria's Electronic Transactions Act for ordinary contracts. Property transfers, wills, and antenuptial contracts require advanced electronic signatures and cannot be signed via this flow.
        </p>
      </div>

      {/* Contract HTML */}
      <div className="glass-card rounded-2xl p-7 mb-6 prose prose-invert prose-sm max-w-none" style={{ fontFamily: "Georgia, serif" }}>
        <div dangerouslySetInnerHTML={{ __html: request.contractHtml }} />
      </div>

      {/* Sign / decline actions */}
      <div className="glass-card rounded-2xl p-5 sticky bottom-4 flex flex-col sm:flex-row gap-3 items-center justify-between" style={{ borderColor: "rgba(201,168,76,0.40)", backgroundColor: "rgba(8,11,20,0.95)", backdropFilter: "blur(12px)" }}>
        <p className="text-xs text-text-muted">By clicking <span className="font-semibold text-text-primary">Sign</span>, you confirm you've read this contract and agree to be bound by its terms.</p>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button onClick={onDecline} className="text-sm font-semibold px-4 py-2 rounded-lg border border-border text-text-primary hover:bg-surface-2">
            Decline
          </button>
          <button onClick={onSign} className="text-sm font-semibold inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg" style={{ backgroundColor: "#C9A84C", color: "#080B14" }}>
            <PenLine size={14} /> Sign contract
          </button>
        </div>
      </div>
    </>
  );
}

function SignedView({ request }: { request: PublicSigningRequestView }) {
  const signedDate = request.signedAt
    ? new Date(request.signedAt).toLocaleString("en-GB", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })
    : "—";
  return (
    <>
      {/* Confirmation banner */}
      <div className="glass-card rounded-2xl p-6 mb-6 flex items-start gap-4 print:hidden" style={{ borderColor: "rgba(16,185,129,0.40)", backgroundColor: "rgba(16,185,129,0.08)" }}>
        <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "rgba(16,185,129,0.15)" }}>
          <Check size={22} className="text-emerald-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-text-primary mb-1">Contract signed.</p>
          <p className="text-sm text-text-muted leading-relaxed">
            Signed by <span className="text-text-primary font-semibold">{request.signatureTypedName ?? request.recipientName}</span> on <span className="text-text-primary font-semibold">{signedDate}</span>. Both parties have been notified by email. This page is your permanent copy — bookmark it or save as PDF below.
          </p>
        </div>
        <button
          onClick={() => window.open(window.location.pathname + "/print", "_blank")}
          className="text-sm font-semibold inline-flex items-center gap-1.5 px-4 py-2 rounded-lg flex-shrink-0"
          style={{ backgroundColor: "#10B981", color: "white" }}
        >
          <Printer size={14} /> Save as PDF
        </button>
      </div>

      {/* Cover info — printable */}
      <div className="glass-card rounded-2xl p-6 mb-6" style={{ borderColor: "rgba(16,185,129,0.30)" }}>
        <p className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: "#10B981" }}>SIGNED · {request.contractType}</p>
        <h1 className="text-2xl font-black text-text-primary mb-3">{request.contractTitle}</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-[10px] font-black uppercase text-text-muted mb-0.5">Sender</p>
            <p className="text-text-primary font-semibold">{request.requesterName}</p>
            <p className="text-xs text-text-muted">{request.requesterEmail}</p>
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-text-muted mb-0.5">Signer</p>
            <p className="text-text-primary font-semibold">{request.signatureTypedName ?? request.recipientName}</p>
            <p className="text-xs text-text-muted">Signed {signedDate}</p>
          </div>
        </div>
      </div>

      {/* Contract HTML */}
      <div className="glass-card rounded-2xl p-7 mb-6 prose prose-invert prose-sm max-w-none" style={{ fontFamily: "Georgia, serif" }}>
        <div dangerouslySetInnerHTML={{ __html: request.contractHtml }} />
      </div>

      {/* Signature panel */}
      <div className="glass-card rounded-2xl p-6 mb-6" style={{ borderColor: "rgba(16,185,129,0.30)", backgroundColor: "rgba(16,185,129,0.04)" }}>
        <p className="text-[10px] font-black uppercase tracking-widest mb-3" style={{ color: "#10B981" }}>Captured Signature</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider mb-1.5 text-text-muted">Signature</p>
            {request.signatureImageData ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={request.signatureImageData}
                alt="Signature"
                style={{ maxWidth: "100%", height: "auto", backgroundColor: "white", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)" }}
              />
            ) : (
              <p className="text-xs text-text-muted italic">Signature image unavailable</p>
            )}
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider mb-0.5 text-text-muted">Typed full name</p>
              <p className="text-sm font-semibold text-text-primary">{request.signatureTypedName ?? "—"}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider mb-0.5 text-text-muted">Signed at</p>
              <p className="text-sm text-text-primary">{signedDate}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider mb-0.5 text-text-muted">Legal validity</p>
              <p className="text-xs text-text-muted leading-relaxed">
                This electronic signature is legally binding under SA's ECTA Section 13 and Nigeria's Electronic Transactions Act for ordinary contracts. Property transfers, wills, and antenuptial contracts require advanced electronic signatures and are not covered.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom action — open print route */}
      <div className="flex justify-end mb-6 print:hidden">
        <button
          onClick={() => window.open(window.location.pathname + "/print", "_blank")}
          className="text-sm font-semibold inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg"
          style={{ backgroundColor: "#10B981", color: "white" }}
        >
          <Download size={14} /> Save signed contract as PDF
        </button>
      </div>
    </>
  );
}
