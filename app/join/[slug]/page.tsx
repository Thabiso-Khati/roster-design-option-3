"use client";

// ============================================================
// ROSTER — Public WhatsApp Opt-In Page  /join/[slug]
// No auth required.
// ============================================================

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { MessageCircle, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

interface Campaign {
  slug: string;
  headline: string;
  description: string | null;
  artist_display_name: string;
  is_active: boolean;
}

type PageState = "loading" | "ready" | "submitting" | "success" | "not_found";

export default function OptInPage() {
  const { slug } = useParams<{ slug: string }>();

  const [pageState, setPageState] = useState<PageState>("loading");
  const [campaign, setCampaign]   = useState<Campaign | null>(null);
  const [name, setName]           = useState("");
  const [whatsapp, setWhatsapp]   = useState("");
  const [consent, setConsent]     = useState(false);
  const [errorMsg, setErrorMsg]   = useState("");

  useEffect(() => {
    if (!slug) return;
    fetch(`/api/optin/${slug}`)
      .then(r => r.json())
      .then(j => {
        if (j.campaign) { setCampaign(j.campaign); setPageState("ready"); }
        else { setPageState("not_found"); }
      })
      .catch(() => setPageState("not_found"));
  }, [slug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consent) { setErrorMsg("Please tick the consent box to continue."); return; }
    setErrorMsg("");
    setPageState("submitting");

    const r = await fetch(`/api/optin/${slug}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, whatsapp, consent }),
    });

    if (r.ok) {
      setPageState("success");
    } else {
      const j = await r.json().catch(() => ({}));
      setErrorMsg(j.error || "Something went wrong. Please try again.");
      setPageState("ready");
    }
  };

  // ── Loading ───────────────────────────────────────────────
  if (pageState === "loading") {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-[#C9A84C]" />
      </div>
    );
  }

  // ── Not found ─────────────────────────────────────────────
  if (pageState === "not_found") {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center px-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-[#1a1a1a] border border-[#2a2a2a] flex items-center justify-center mb-6">
          <MessageCircle size={28} className="text-[#444]" />
        </div>
        <h1 className="text-xl font-black text-white mb-2">Link not found</h1>
        <p className="text-sm text-gray-500">This opt-in link is no longer active or doesn&apos;t exist.</p>
      </div>
    );
  }

  // ── Success ───────────────────────────────────────────────
  if (pageState === "success") {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center px-6 text-center">
        <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mb-6">
          <CheckCircle2 size={32} className="text-green-400" />
        </div>
        <h1 className="text-2xl font-black text-white mb-3">You&apos;re in!</h1>
        <p className="text-sm text-gray-400 max-w-xs leading-relaxed mb-10">
          You&apos;ll hear from{" "}
          <span className="text-white font-semibold">{campaign?.artist_display_name}</span>{" "}
          on WhatsApp soon. Reply{" "}
          <span className="text-red-400 font-mono font-bold">STOP</span>{" "}
          at any time to unsubscribe.
        </p>
        <p className="text-[11px] uppercase tracking-[0.2em] text-gray-700">
          Powered by <span className="text-[#C9A84C]/60 font-black">ROSTER</span>
        </p>
      </div>
    );
  }

  // ── Form ──────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center px-5 py-14">
      <div className="w-full max-w-[420px]">

        {/* Header */}
        <div className="text-center mb-10">
          <div
            className="inline-flex items-center justify-center w-[72px] h-[72px] rounded-2xl mb-5"
            style={{
              background: "linear-gradient(135deg, #1c1a12 0%, #2a2414 100%)",
              border: "1px solid rgba(201,168,76,0.25)",
            }}
          >
            <MessageCircle size={30} style={{ color: "#C9A84C" }} />
          </div>

          <p className="text-[11px] font-black uppercase tracking-[0.25em] text-[#C9A84C] mb-2">
            {campaign?.artist_display_name}
          </p>
          <h1 className="text-[1.75rem] font-black text-white leading-tight mb-3">
            {campaign?.headline}
          </h1>
          {campaign?.description && (
            <p className="text-[0.9rem] text-gray-400 leading-relaxed max-w-sm mx-auto">
              {campaign.description}
            </p>
          )}
        </div>

        {/* Form card */}
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl p-6 space-y-5"
          style={{ background: "#111116", border: "1px solid #1e1e24" }}
        >
          {/* Name */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-[0.18em] text-gray-500 mb-2">
              Your Name
            </label>
            <input
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Thabo Nkosi"
              className="w-full rounded-xl px-4 py-3.5 text-sm text-white placeholder:text-gray-600 focus:outline-none transition-colors"
              style={{
                background: "#0a0a0d",
                border: "1px solid #2a2a30",
              }}
              onFocus={e => (e.currentTarget.style.borderColor = "#C9A84C")}
              onBlur={e  => (e.currentTarget.style.borderColor = "#2a2a30")}
            />
          </div>

          {/* WhatsApp */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-[0.18em] text-gray-500 mb-2">
              WhatsApp Number
            </label>
            <input
              required
              value={whatsapp}
              onChange={e => setWhatsapp(e.target.value)}
              placeholder="+27 71 000 0000"
              type="tel"
              className="w-full rounded-xl px-4 py-3.5 text-sm text-white placeholder:text-gray-600 focus:outline-none transition-colors"
              style={{
                background: "#0a0a0d",
                border: "1px solid #2a2a30",
              }}
              onFocus={e => (e.currentTarget.style.borderColor = "#C9A84C")}
              onBlur={e  => (e.currentTarget.style.borderColor = "#2a2a30")}
            />
            <p className="text-[10px] text-gray-600 mt-1.5">
              Include your country code, e.g. +27 for South Africa
            </p>
          </div>

          {/* Consent */}
          <label className="flex items-start gap-3 cursor-pointer group">
            <div className="relative mt-0.5 flex-shrink-0">
              <input
                type="checkbox"
                checked={consent}
                onChange={e => setConsent(e.target.checked)}
                className="sr-only"
              />
              <div
                className="w-5 h-5 rounded-md flex items-center justify-center transition-all"
                style={{
                  background:    consent ? "#C9A84C"   : "transparent",
                  border: `2px solid ${consent ? "#C9A84C" : "#3a3a42"}`,
                }}
              >
                {consent && (
                  <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
                    <path d="M1 4L4 7.5L10 1" stroke="#000" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>
            </div>
            <span className="text-[0.8rem] text-gray-400 leading-relaxed">
              I agree to receive WhatsApp messages from{" "}
              <span className="text-white font-semibold">{campaign?.artist_display_name}</span>.
              {" "}I can reply{" "}
              <span className="text-red-400 font-mono font-bold text-[0.75rem]">STOP</span>
              {" "}to unsubscribe at any time.
            </span>
          </label>

          {/* Error */}
          {errorMsg && (
            <div className="flex items-center gap-2 text-xs text-red-400 rounded-xl px-4 py-3"
              style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
              <AlertCircle size={13} className="flex-shrink-0" />
              {errorMsg}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={pageState === "submitting" || !name.trim() || !whatsapp.trim() || !consent}
            className="w-full py-4 rounded-xl text-[0.9rem] font-black text-black transition-opacity disabled:opacity-35 hover:opacity-90 flex items-center justify-center gap-2"
            style={{ backgroundColor: "#C9A84C" }}
          >
            {pageState === "submitting"
              ? <><Loader2 size={15} className="animate-spin" /> Joining…</>
              : "Join via WhatsApp"}
          </button>
        </form>

        {/* Footer */}
        <p className="text-center text-[10px] uppercase tracking-[0.2em] text-gray-700 mt-7">
          Powered by <span className="font-black" style={{ color: "rgba(201,168,76,0.5)" }}>ROSTER</span>
        </p>
      </div>
    </div>
  );
}
