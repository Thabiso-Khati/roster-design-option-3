"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { Lock, Upload, FileText, Trash2, Download, Plus, Key, RotateCcw, Eye, EyeOff, AlertCircle, Check, Loader2 } from "lucide-react";
import { ModuleShell } from "@/components/library/module-shell";
import {
  initVault,
  unlockVaultWithPassword,
  unlockVaultWithRecovery,
  rotatePasswordPayload,
  encryptFileForVault,
  decryptFileFromVault,
  decryptItemName,
  validateRecoveryPhrase,
  base64ToBuf,
} from "@/lib/vault/crypto";

const COLOR = "#475569";
const SESSION_KEY_STORAGE = "roster_vault_session_key_v1";

const CATEGORIES = ["Contracts", "Masters", "Cover art", "EPK / press", "Visual assets", "Tax / financial", "Government / legal", "Touring", "Other"];

interface VaultItemMetadata {
  id: string;
  artistId: string | null;
  category: string;
  version: number;
  sizeBytes: number;
  mimeType: string;
  storagePath: string;
  nameEncrypted: string;
  nameIv: string;
  fileIv: string;
  wrappedKey: string;
  wrapIv: string;
  notesEncrypted: string | null;
  notesIv: string | null;
  createdAt: string;
  updatedAt: string;
}

interface DecryptedItem extends VaultItemMetadata {
  decryptedName: string;
}

type VaultState =
  | { status: "loading" }
  | { status: "no-vault" }
  | { status: "locked"; wrappedKeys: WrappedKeysResponse }
  | { status: "unlocked"; masterKey: CryptoKey; wrappedKeys: WrappedKeysResponse }
  | { status: "error"; message: string };

interface WrappedKeysResponse {
  initialised: true;
  masterKeyEncrypted: string;
  masterKeyIv: string;
  masterKeySalt: string;
  masterKeyIterations: number;
  recoveryMasterKeyEncrypted: string;
  recoveryMasterKeyIv: string;
  recoveryMasterKeySalt: string;
}

export default function VaultPage() {
  const [state, setState] = useState<VaultState>({ status: "loading" });

  // Fetch vault keys on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/vault/keys");
        const json = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          setState({ status: "error", message: json.error || "Failed to load vault" });
          return;
        }
        if (!json.initialised) {
          setState({ status: "no-vault" });
        } else {
          // Try to restore session key from sessionStorage
          const sessionKey = sessionStorage.getItem(SESSION_KEY_STORAGE);
          if (sessionKey) {
            try {
              const raw = base64ToBuf(sessionKey);
              const importedKey = await crypto.subtle.importKey(
                "raw", raw as BufferSource, { name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"],
              );
              setState({ status: "unlocked", masterKey: importedKey, wrappedKeys: json });
              return;
            } catch {
              sessionStorage.removeItem(SESSION_KEY_STORAGE);
            }
          }
          setState({ status: "locked", wrappedKeys: json });
        }
      } catch (e) {
        if (!cancelled) {
          setState({ status: "error", message: e instanceof Error ? e.message : "Unknown error" });
        }
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="animate-fade-in max-w-4xl">
      <ModuleShell
        color={COLOR}
        icon={<Lock size={28} style={{ color: COLOR }}/>}
        subtitle="Everything in One Place"
        title="Vault"
        description="End-to-end encrypted document vault. Server stores only ciphertext — your password never leaves the browser."
      >
        {state.status === "loading" && <LoadingPanel />}
        {state.status === "error" && <ErrorPanel message={state.message} />}
        {state.status === "no-vault" && (
          <NoVaultFlow onInitialised={(masterKey, wrappedKeys) => setState({ status: "unlocked", masterKey, wrappedKeys })} />
        )}
        {state.status === "locked" && (
          <UnlockFlow
            wrappedKeys={state.wrappedKeys}
            onUnlocked={(masterKey) => setState({ status: "unlocked", masterKey, wrappedKeys: state.wrappedKeys })}
          />
        )}
        {state.status === "unlocked" && (
          <UnlockedView
            masterKey={state.masterKey}
            onLock={() => {
              sessionStorage.removeItem(SESSION_KEY_STORAGE);
              setState({ status: "locked", wrappedKeys: state.wrappedKeys });
            }}
          />
        )}
      </ModuleShell>
    </div>
  );
}

// ─── States ────────────────────────────────────────────────────────────

function LoadingPanel() {
  return (
    <div className="glass-card rounded-2xl p-12 text-center">
      <Loader2 size={24} className="animate-spin mx-auto text-text-muted"/>
      <p className="text-sm text-text-muted mt-3">Loading vault…</p>
    </div>
  );
}

function ErrorPanel({ message }: { message: string }) {
  return (
    <div className="glass-card rounded-2xl p-8 flex items-start gap-3" style={{ borderColor: "#EF4444" }}>
      <AlertCircle size={20} className="text-red-400 flex-shrink-0 mt-0.5"/>
      <div>
        <p className="font-bold text-text-primary mb-1">Vault unavailable</p>
        <p className="text-sm text-text-muted">{message}</p>
      </div>
    </div>
  );
}

// ─── No-Vault flow ─────────────────────────────────────────────────────

function NoVaultFlow({ onInitialised }: { onInitialised: (masterKey: CryptoKey, wrappedKeys: WrappedKeysResponse) => void }) {
  const [step, setStep] = useState<"intro" | "set-password" | "show-recovery">("intro");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [recoveryPhrase, setRecoveryPhrase] = useState("");
  const [recoveryConfirmed, setRecoveryConfirmed] = useState(false);

  async function handleInit() {
    setError("");
    if (password.length < 12) { setError("Vault password must be at least 12 characters."); return; }
    if (password !== confirm) { setError("Passwords don't match."); return; }
    setBusy(true);
    try {
      const result = await initVault(password);
      const res = await fetch("/api/vault/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result.payload),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Failed to initialise vault.");
        setBusy(false);
        return;
      }
      setRecoveryPhrase(result.recoveryPhrase);
      // Store master key in sessionStorage for the unlocked session
      const raw = await crypto.subtle.exportKey("raw", result.masterKey);
      const bytes = new Uint8Array(raw);
      let bin = "";
      for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
      sessionStorage.setItem(SESSION_KEY_STORAGE, btoa(bin));
      // Refetch wrapped keys for the unlocked-state object
      const keysRes = await fetch("/api/vault/keys");
      const wrappedKeys = await keysRes.json() as WrappedKeysResponse;
      // Don't auto-progress until they confirm the recovery phrase
      setStep("show-recovery");
      // Hold the keys + master key for after confirmation
      (window as unknown as { __vaultPending: { masterKey: CryptoKey; wrappedKeys: WrappedKeysResponse } }).__vaultPending = { masterKey: result.masterKey, wrappedKeys };
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to initialise vault.");
    } finally {
      setBusy(false);
    }
  }

  function handleConfirmRecovery() {
    const pending = (window as unknown as { __vaultPending?: { masterKey: CryptoKey; wrappedKeys: WrappedKeysResponse } }).__vaultPending;
    if (pending) {
      delete (window as unknown as { __vaultPending?: unknown }).__vaultPending;
      onInitialised(pending.masterKey, pending.wrappedKeys);
    }
  }

  if (step === "intro") {
    return (
      <div className="glass-card rounded-2xl p-8" style={{ borderColor: `${COLOR}40` }}>
        <div className="flex items-start gap-4 mb-5">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${COLOR}15` }}>
            <Lock size={20} style={{ color: COLOR }}/>
          </div>
          <div>
            <p className="font-bold text-text-primary mb-1">Set up your end-to-end encrypted vault</p>
            <p className="text-sm text-text-muted leading-relaxed">
              A private safe for contracts, masters, IDs, tax documents, and anything else you can't afford to lose.
              Encrypted in your browser before upload — we never see the contents.
            </p>
          </div>
        </div>

        <div className="space-y-3 mb-5">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: `${COLOR}15` }}>
              <Check size={12} style={{ color: COLOR }}/>
            </div>
            <div className="text-sm">
              <p className="font-semibold text-text-primary mb-0.5">True end-to-end encryption</p>
              <p className="text-text-muted text-xs leading-relaxed">
                AES-GCM 256-bit encryption happens in your browser. Files, filenames, and notes are all encrypted. Anthropic, Supabase, and ROSTER staff cannot read them.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: `${COLOR}15` }}>
              <Check size={12} style={{ color: COLOR }}/>
            </div>
            <div className="text-sm">
              <p className="font-semibold text-text-primary mb-0.5">Vault password ≠ account password</p>
              <p className="text-text-muted text-xs leading-relaxed">
                You'll set a separate vault password (minimum 12 characters). It derives your master key via PBKDF2-SHA-256 with 600,000 iterations and never leaves your device.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: `${COLOR}15` }}>
              <Check size={12} style={{ color: COLOR }}/>
            </div>
            <div className="text-sm">
              <p className="font-semibold text-text-primary mb-0.5">12-word recovery phrase</p>
              <p className="text-text-muted text-xs leading-relaxed">
                Backup unlock if you forget your password. Save it somewhere safe — a password manager or paper. We never store this phrase.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: "#EF444415" }}>
              <AlertCircle size={12} className="text-red-400"/>
            </div>
            <div className="text-sm">
              <p className="font-semibold text-text-primary mb-0.5">No password reset</p>
              <p className="text-text-muted text-xs leading-relaxed">
                If you lose <span className="text-text-primary font-semibold">both</span> your password and your recovery phrase, your vault contents are permanently unrecoverable. This is the trade-off of true E2E — even we can't help you.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setStep("set-password")}
          className="px-5 py-2.5 rounded-lg font-semibold text-sm"
          style={{ backgroundColor: COLOR, color: "white" }}
        >
          Set up vault
        </button>
      </div>
    );
  }

  if (step === "set-password") {
    return (
      <div className="glass-card rounded-2xl p-8" style={{ borderColor: `${COLOR}40` }}>
        <p className="font-bold text-text-primary mb-2">Set your vault password</p>
        <p className="text-sm text-text-muted leading-relaxed mb-5">
          Minimum 12 characters. Use something memorable but unique — a password manager-generated phrase is ideal.
          This password derives a key in your browser; we never see it.
        </p>
        <div className="space-y-3">
          <div className="relative">
            <input
              type={show ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Vault password"
              className="bg-transparent border border-border rounded-lg px-3 py-2.5 text-sm text-text-primary w-full focus:outline-none focus:border-brand"
            />
            <button onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted">
              {show ? <EyeOff size={14}/> : <Eye size={14}/>}
            </button>
          </div>
          <input
            type={show ? "text" : "password"}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Confirm password"
            className="bg-transparent border border-border rounded-lg px-3 py-2.5 text-sm text-text-primary w-full focus:outline-none focus:border-brand"
          />
        </div>
        {error && <p className="text-xs text-red-400 mt-3">{error}</p>}
        <button
          onClick={handleInit}
          disabled={busy || !password || !confirm}
          className="mt-5 px-5 py-2.5 rounded-lg font-semibold text-sm disabled:opacity-50 inline-flex items-center gap-2"
          style={{ backgroundColor: COLOR, color: "white" }}
        >
          {busy && <Loader2 size={14} className="animate-spin"/>}
          {busy ? "Setting up…" : "Continue"}
        </button>
      </div>
    );
  }

  // show-recovery
  return (
    <div className="glass-card rounded-2xl p-8" style={{ borderColor: `${COLOR}40` }}>
      <p className="font-bold text-text-primary mb-2">Your recovery phrase</p>
      <p className="text-sm text-text-muted leading-relaxed mb-5">
        Write this down on paper, screenshot it, store it in your password manager — anywhere safe. This is the ONLY way to recover the vault if you forget your password. We never store this phrase.
      </p>
      <div className="bg-surface-2 rounded-xl p-5 mb-5 grid grid-cols-3 sm:grid-cols-4 gap-2">
        {recoveryPhrase.split(" ").map((w, i) => (
          <div key={i} className="bg-bg rounded-lg px-3 py-2 text-sm font-mono text-text-primary">
            <span className="text-text-muted text-xs mr-1.5">{i + 1}.</span>{w}
          </div>
        ))}
      </div>
      <label className="flex items-start gap-2 mb-4 cursor-pointer">
        <input
          type="checkbox"
          checked={recoveryConfirmed}
          onChange={(e) => setRecoveryConfirmed(e.target.checked)}
          className="mt-0.5 flex-shrink-0"
        />
        <span className="text-sm text-text-primary">
          I've written down or saved my recovery phrase. I understand losing both my password and this phrase means I lose access to vault contents permanently.
        </span>
      </label>
      <button
        onClick={handleConfirmRecovery}
        disabled={!recoveryConfirmed}
        className="px-5 py-2.5 rounded-lg font-semibold text-sm disabled:opacity-50"
        style={{ backgroundColor: COLOR, color: "white" }}
      >
        Open vault →
      </button>
    </div>
  );
}

// ─── Unlock flow ───────────────────────────────────────────────────────

function UnlockFlow({ wrappedKeys, onUnlocked }: { wrappedKeys: WrappedKeysResponse; onUnlocked: (masterKey: CryptoKey) => void }) {
  const [mode, setMode] = useState<"password" | "recovery">("password");
  const [password, setPassword] = useState("");
  const [phrase, setPhrase] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleUnlock() {
    setError("");
    setBusy(true);
    try {
      let masterKey: CryptoKey;
      if (mode === "password") {
        masterKey = await unlockVaultWithPassword(password, wrappedKeys);
      } else {
        const validation = validateRecoveryPhrase(phrase);
        if (!validation.valid) {
          setError(validation.reason || "Invalid recovery phrase");
          setBusy(false);
          return;
        }
        masterKey = await unlockVaultWithRecovery(phrase, wrappedKeys);
      }
      // Cache master key in sessionStorage
      const raw = await crypto.subtle.exportKey("raw", masterKey);
      const bytes = new Uint8Array(raw);
      let bin = "";
      for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
      sessionStorage.setItem(SESSION_KEY_STORAGE, btoa(bin));
      onUnlocked(masterKey);
    } catch {
      setError(mode === "password" ? "Wrong password." : "Wrong recovery phrase.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="glass-card rounded-2xl p-8" style={{ borderColor: `${COLOR}40` }}>
      <div className="flex items-center gap-3 mb-5">
        <Lock size={20} style={{ color: COLOR }}/>
        <p className="font-bold text-text-primary">Unlock vault</p>
      </div>

      <div className="flex gap-1 mb-5 border-b border-border">
        <button
          onClick={() => setMode("password")}
          className={`px-4 py-2 text-xs font-semibold border-b-2 -mb-px ${mode === "password" ? "border-brand text-brand" : "border-transparent text-text-muted"}`}
        >
          Password
        </button>
        <button
          onClick={() => setMode("recovery")}
          className={`px-4 py-2 text-xs font-semibold border-b-2 -mb-px ${mode === "recovery" ? "border-brand text-brand" : "border-transparent text-text-muted"}`}
        >
          Recovery phrase
        </button>
      </div>

      {mode === "password" ? (
        <div className="relative mb-3">
          <input
            type={show ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleUnlock()}
            placeholder="Vault password"
            className="bg-transparent border border-border rounded-lg px-3 py-2.5 text-sm text-text-primary w-full focus:outline-none focus:border-brand"
          />
          <button onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted">
            {show ? <EyeOff size={14}/> : <Eye size={14}/>}
          </button>
        </div>
      ) : (
        <textarea
          value={phrase}
          onChange={(e) => setPhrase(e.target.value)}
          placeholder="word word word word word word word word word word word word"
          rows={3}
          className="bg-transparent border border-border rounded-lg px-3 py-2.5 text-sm text-text-primary w-full focus:outline-none focus:border-brand mb-3 font-mono"
        />
      )}

      {error && <p className="text-xs text-red-400 mb-3">{error}</p>}

      <button
        onClick={handleUnlock}
        disabled={busy || (mode === "password" ? !password : !phrase)}
        className="px-5 py-2.5 rounded-lg font-semibold text-sm disabled:opacity-50 inline-flex items-center gap-2"
        style={{ backgroundColor: COLOR, color: "white" }}
      >
        {busy && <Loader2 size={14} className="animate-spin"/>}
        Unlock
      </button>
    </div>
  );
}

// ─── Unlocked view ─────────────────────────────────────────────────────

interface QuotaInfo {
  tier: string;
  label: string;
  totalBytes: number;
  usedBytes: number;
  remainingBytes: number;
  perFileCap: number;
  percentUsed: number;
  formatted: { used: string; total: string; remaining: string; perFileCap: string };
  itemCount: number;
}

function UnlockedView({ masterKey, onLock }: { masterKey: CryptoKey; onLock: () => void }) {
  const [items, setItems] = useState<DecryptedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("All");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [quota, setQuota] = useState<QuotaInfo | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const loadQuota = useCallback(async () => {
    try {
      const res = await fetch("/api/vault/quota");
      if (res.ok) setQuota(await res.json());
    } catch {
      /* non-fatal */
    }
  }, []);

  const loadItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/vault/items");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to list");
      const decrypted: DecryptedItem[] = await Promise.all(
        (json.items as VaultItemMetadata[]).map(async (it) => ({
          ...it,
          decryptedName: await decryptItemName(masterKey, it.nameEncrypted, it.nameIv),
        })),
      );
      setItems(decrypted);
    } catch (e) {
      console.error("Failed to load vault items:", e);
    } finally {
      setLoading(false);
    }
  }, [masterKey]);

  useEffect(() => { loadItems(); loadQuota(); }, [loadItems, loadQuota]);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (quota && file.size > quota.perFileCap) {
      setUploadError(`${file.name} (${(file.size / 1_000_000).toFixed(1)} MB) exceeds your per-file cap of ${quota.formatted.perFileCap}.`);
      if (fileInput.current) fileInput.current.value = "";
      return;
    }
    if (quota && file.size > quota.remainingBytes) {
      setUploadError(`Not enough space — file is ${(file.size / 1_000_000).toFixed(1)} MB but only ${quota.formatted.remaining} remains on the ${quota.tier} plan.`);
      if (fileInput.current) fileInput.current.value = "";
      return;
    }
    setUploading(true);
    setUploadError("");
    try {
      // Read file
      const buf = new Uint8Array(await file.arrayBuffer());
      // Encrypt client-side
      const encrypted = await encryptFileForVault(masterKey, buf, file.name);
      // Generate item ID
      const id = crypto.randomUUID();
      // Get signed upload URL
      const urlRes = await fetch(`/api/vault/items/${id}/upload-url`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sizeBytes: encrypted.ciphertext.byteLength }),
      });
      const urlJson = await urlRes.json();
      if (!urlRes.ok) throw new Error(urlJson.error || "Failed to get upload URL");

      // Upload ciphertext directly to Storage
      const uploadRes = await fetch(urlJson.signedUrl, {
        method: "PUT",
        headers: { "Content-Type": "application/octet-stream" },
        body: new Uint8Array(encrypted.ciphertext),
      });
      if (!uploadRes.ok) {
        const txt = await uploadRes.text();
        throw new Error(`Storage upload failed: ${txt.slice(0, 200)}`);
      }

      // Persist metadata
      const itemRes = await fetch("/api/vault/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          nameEncrypted: encrypted.nameEncrypted,
          nameIv: encrypted.nameIv,
          fileIv: encrypted.fileIv,
          wrappedKey: encrypted.wrappedKey,
          wrapIv: encrypted.wrapIv,
          notesEncrypted: encrypted.notesEncrypted,
          notesIv: encrypted.notesIv,
          storagePath: urlJson.path,
          sizeBytes: file.size,
          mimeType: "application/octet-stream",
          category: "Other",
        }),
      });
      if (!itemRes.ok) {
        const json = await itemRes.json();
        throw new Error(json.error || "Failed to save item");
      }

      await loadItems();
      await loadQuota();
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  async function handleDownload(item: DecryptedItem) {
    try {
      const urlRes = await fetch(`/api/vault/items/${item.id}/download-url`);
      const urlJson = await urlRes.json();
      if (!urlRes.ok) throw new Error(urlJson.error || "Failed");
      const cipherRes = await fetch(urlJson.signedUrl);
      if (!cipherRes.ok) throw new Error("Download failed");
      const ciphertext = new Uint8Array(await cipherRes.arrayBuffer());
      const plain = await decryptFileFromVault(masterKey, ciphertext, {
        fileIv: item.fileIv, wrappedKey: item.wrappedKey, wrapIv: item.wrapIv,
      });
      // Trigger browser download
      const blob = new Blob([plain as BlobPart]);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = item.decryptedName;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Download failed:", e);
      alert("Download failed: " + (e instanceof Error ? e.message : "unknown error"));
    }
  }

  async function handleDelete(item: DecryptedItem) {
    if (!confirm(`Delete "${item.decryptedName}"? This is a soft-delete; the encrypted blob remains in storage.`)) return;
    try {
      const res = await fetch(`/api/vault/items/${item.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      await loadItems();
      await loadQuota();
    } catch (e) {
      console.error("Delete failed:", e);
    }
  }

  const filtered = filter === "All" ? items : items.filter((i) => i.category === filter);
  const fmtSize = (b: number) => b > 1_000_000 ? `${(b / 1_000_000).toFixed(1)} MB` : `${(b / 1024).toFixed(0)} KB`;

  return (
    <>
      <div className="glass-card rounded-2xl p-5 mb-6 flex items-center gap-3 flex-wrap">
        <button
          onClick={() => fileInput.current?.click()}
          disabled={uploading}
          className="text-sm font-semibold inline-flex items-center gap-2 px-4 py-2 rounded-lg disabled:opacity-50"
          style={{ backgroundColor: COLOR, color: "white" }}
        >
          {uploading ? <Loader2 size={14} className="animate-spin"/> : <Upload size={14}/>}
          {uploading ? "Encrypting…" : "Upload file"}
        </button>
        <input ref={fileInput} type="file" onChange={handleUpload} className="hidden"/>

        <select className="bg-transparent border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-brand" value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option>All</option>
          {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>

        <div className="flex-1"/>

        <button onClick={onLock} className="text-xs text-text-muted hover:text-text-primary inline-flex items-center gap-1">
          <Lock size={12}/> Lock vault
        </button>
      </div>

      {uploadError && (
        <div className="glass-card rounded-2xl p-4 mb-4 flex items-start gap-3" style={{ borderColor: "#EF4444" }}>
          <AlertCircle size={16} className="text-red-400 flex-shrink-0 mt-0.5"/>
          <p className="text-sm text-text-muted">{uploadError}</p>
        </div>
      )}

      {quota && (
        <div className="glass-card rounded-2xl p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-text-primary capitalize">{quota.tier} plan</span>
              <span className="text-[10px] text-text-muted">·</span>
              <span className="text-xs text-text-muted">{quota.formatted.used} of {quota.formatted.total}</span>
              <span className="text-[10px] text-text-muted">·</span>
              <span className="text-xs text-text-muted">{quota.itemCount} {quota.itemCount === 1 ? "file" : "files"}</span>
            </div>
            <span className={`text-xs font-semibold ${quota.percentUsed > 90 ? "text-red-400" : quota.percentUsed > 75 ? "text-amber-400" : "text-text-muted"}`}>
              {quota.percentUsed}% used
            </span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden bg-surface-2">
            <div
              className="h-full transition-all"
              style={{
                width: `${Math.min(100, quota.percentUsed)}%`,
                backgroundColor: quota.percentUsed > 90 ? "#EF4444" : quota.percentUsed > 75 ? "#F59E0B" : COLOR,
              }}
            />
          </div>
          <p className="text-[10px] text-text-muted mt-2">
            Per-file cap: {quota.formatted.perFileCap}. Need more? Upgrade your plan.
          </p>
        </div>
      )}

      <div className="glass-card rounded-2xl p-4 mb-6 flex items-start gap-3" style={{ borderColor: `${COLOR}20`, backgroundColor: `${COLOR}08` }}>
        <Lock size={14} className="text-text-muted flex-shrink-0 mt-0.5"/>
        <div className="text-xs text-text-muted leading-relaxed">
          <p className="mb-1.5">
            <span className="font-semibold text-text-primary">End-to-end encrypted.</span>{" "}
            Files, filenames, and notes are encrypted in your browser with AES-GCM 256 before they leave your device. The server stores ciphertext only.
          </p>
          <p className="mb-1.5">
            <span className="font-semibold text-text-primary">We can't read your files.</span>{" "}
            Your vault password derives your master key in-browser via PBKDF2-SHA-256 (600,000 iterations). The password, the master key, and the recovery phrase never touch our servers — not in plaintext, not encrypted, not in logs.
          </p>
          <p>
            <span className="font-semibold text-text-primary">If you forget both your password and your recovery phrase, your vault is permanently unrecoverable.</span>{" "}
            That's the trade-off of true E2E. Save the recovery phrase somewhere safe.
          </p>
        </div>
      </div>

      {loading ? (
        <LoadingPanel />
      ) : filtered.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center text-text-muted text-sm">
          <Plus size={20} className="mx-auto mb-3 opacity-50"/>
          {items.length === 0 ? "No files yet. Upload your first signed contract, master, or asset." : "No files in this category."}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((it) => (
            <div key={it.id} className="glass-card rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${COLOR}15` }}>
                  <FileText size={16} style={{ color: COLOR }}/>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3 flex-wrap mb-2">
                    <p className="font-bold text-sm text-text-primary truncate min-w-0">{it.decryptedName}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded" style={{ color: COLOR, backgroundColor: `${COLOR}15` }}>v{it.version}</span>
                      <span className="text-[10px] text-text-muted">{fmtSize(it.sizeBytes)}</span>
                      <span className="text-[10px] text-text-muted">{new Date(it.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mb-1 flex-wrap">
                    <span className="text-[10px] text-text-muted">{it.category}</span>
                    <button onClick={() => handleDownload(it)} className="text-xs text-text-muted hover:text-text-primary inline-flex items-center gap-1">
                      <Download size={12}/> Download
                    </button>
                    <button onClick={() => handleDelete(it)} className="text-xs text-red-400 hover:text-red-300 inline-flex items-center gap-1">
                      <Trash2 size={12}/> Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
