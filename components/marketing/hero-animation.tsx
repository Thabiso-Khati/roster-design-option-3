"use client";

// ── Inner orbit icons (radius 150px, clockwise 20s) ──────────────────────
const INNER_ICONS = [
  {
    id: "spotify", delay: "0s",
    bg: "#1DB954", glow: "#1DB954",
    svg: <svg viewBox="0 0 24 24" fill="white" width="20" height="20"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/></svg>,
  },
  {
    id: "youtube", delay: "-3.33s",
    bg: "#FF0000", glow: "#FF0000",
    svg: <svg viewBox="0 0 24 24" fill="white" width="20" height="20"><path d="M23.495 6.205a3.007 3.007 0 00-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 00.527 6.205a31.247 31.247 0 00-.522 5.805 31.247 31.247 0 00.522 5.783 3.007 3.007 0 002.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 002.088-2.088 31.247 31.247 0 00.5-5.783 31.247 31.247 0 00-.5-5.805zM9.609 15.601V8.408l6.264 3.602z"/></svg>,
  },
  {
    id: "apple-music", delay: "-6.67s",
    bg: "#FC3C44", glow: "#FC3C44",
    svg: <svg viewBox="0 0 24 24" fill="white" width="20" height="20"><path d="M23.994 6.124a9.23 9.23 0 00-.24-2.19c-.317-1.31-1.048-2.31-2.18-3.043a6.303 6.303 0 00-1.86-.86c-.62-.147-1.26-.216-1.903-.23-.217-.005-.435-.01-.652-.014H5.847c-.204.004-.407.01-.61.015-.668.015-1.33.085-1.977.244C1.86.388.916 1.21.41 2.4a7.05 7.05 0 00-.38 1.74c-.03.28-.046.562-.05.845C0 5.18 0 5.374 0 5.568v12.86c.003.194.006.388.01.582.005.28.02.562.05.84.07.608.22 1.2.47 1.76.55 1.24 1.49 2.07 2.78 2.45.62.183 1.26.265 1.9.285.22.008.44.012.66.013.22.002.44.002.66.002h12.86c.21 0 .42 0 .63-.002.218-.001.434-.006.652-.013.64-.02 1.28-.1 1.9-.285 1.29-.38 2.23-1.21 2.78-2.45.25-.56.4-1.15.47-1.76.03-.278.044-.56.05-.84.004-.194.006-.388.01-.582V5.568c0-.194 0-.388-.006-.582zM14.07 6.78v8.63c0 1.365-.993 2.418-2.357 2.532-.203.017-.407.02-.61.008-.55-.033-1.066-.207-1.456-.598-.46-.46-.607-1.04-.492-1.657.115-.617.498-1.05 1.073-1.312.36-.163.74-.25 1.12-.33.203-.042.408-.083.61-.132.34-.083.526-.28.53-.63.01-.61.008-1.22.007-1.83V8.78c0-.15-.05-.2-.2-.18l-3.57.6c-.16.026-.21.09-.21.26v5.77c0 .46-.01.92-.012 1.38-.005.9-.37 1.64-1.1 2.15-.54.38-1.16.54-1.81.55-.45.01-.9-.05-1.32-.22-.82-.34-1.3-.95-1.41-1.83-.11-.86.17-1.59.82-2.14.41-.35.9-.54 1.42-.63.28-.05.56-.09.84-.14.33-.06.53-.25.54-.58.01-.66.008-1.32.007-1.98V6.28c0-.31.14-.52.44-.58l5.76-.98c.51-.087 1.02.27 1.02.77v1.29z"/></svg>,
  },
  {
    id: "instagram", delay: "-10s",
    bg: "linear-gradient(135deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)", glow: "#dc2743",
    svg: <svg viewBox="0 0 24 24" fill="white" width="18" height="18"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>,
  },
  {
    id: "tiktok", delay: "-13.33s",
    bg: "#010101", glow: "#69C9D0",
    svg: <svg viewBox="0 0 24 24" fill="white" width="18" height="18"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.76a4.85 4.85 0 01-1.01-.07z"/></svg>,
  },
  {
    id: "soundcloud", delay: "-16.67s",
    bg: "#FF5500", glow: "#FF5500",
    svg: <svg viewBox="0 0 24 24" fill="white" width="20" height="20"><path d="M1.175 12.225c-.017 0-.034.002-.05.006l-.26 2.099.26 2.05c.016.003.033.005.05.005.285 0 .517-.232.517-.517v-3.126c0-.285-.232-.517-.517-.517zm-.899.734c-.006.044-.01.09-.01.136v2.457c0 .046.004.09.01.136l1.015-1.365-1.015-1.364zm5.634-4.686c-.163 0-.326.013-.487.04C5.068 6.408 3.693 5.25 2.07 5.25c-.89 0-1.614.72-1.614 1.61v5.38c0 .89.72 1.61 1.61 1.61h4.844c.89 0 1.61-.72 1.61-1.61V9.883c0-.89-.72-1.61-1.61-1.61zm-.003 5.39H2.07a.612.612 0 01-.612-.612V6.86a.612.612 0 01.612-.612c1.326 0 2.404 1.077 2.404 2.404 0 .062-.003.122-.008.182.157-.05.32-.077.487-.077.88 0 1.594.714 1.594 1.594s-.714 1.594-1.594 1.594l-.05-.002zm14.857-2.43c-.28 0-.55.05-.81.135-.208-1.812-1.74-3.22-3.607-3.22-1.868 0-3.4 1.41-3.606 3.225-.26-.088-.53-.135-.81-.135-1.494 0-2.706 1.212-2.706 2.706s1.212 2.706 2.706 2.706h8.833c1.494 0 2.706-1.212 2.706-2.706s-1.212-2.706-2.706-2.706z"/></svg>,
  },
] as const;

// ── Outer orbit icons (radius 232px, counter-clockwise 30s, 10 icons × 3s) ─
const OUTER_ICONS = [
  {
    id: "paystack", delay: "0s",
    bg: "#00C3F7", glow: "#00C3F7",
    svg: <svg viewBox="0 0 24 24" fill="white" width="18" height="18"><path d="M2 7.5A1.5 1.5 0 013.5 6h17a1.5 1.5 0 010 3h-17A1.5 1.5 0 012 7.5zm0 4.5A1.5 1.5 0 013.5 10.5h17a1.5 1.5 0 010 3h-17A1.5 1.5 0 012 12zm0 4.5A1.5 1.5 0 013.5 15h10a1.5 1.5 0 010 3h-10A1.5 1.5 0 012 16.5z"/></svg>,
  },
  {
    id: "word", delay: "-3s",
    bg: "#2B579A", glow: "#2B579A",
    svg: <svg viewBox="0 0 24 24" fill="white" width="18" height="18"><path d="M19.5 3h-15A1.5 1.5 0 003 4.5v15A1.5 1.5 0 004.5 21h15a1.5 1.5 0 001.5-1.5v-15A1.5 1.5 0 0019.5 3zM7.5 15.5l-1.6-6.5h1.3l.9 4.4 1-4.4h1.2l1 4.4.9-4.4h1.3l-1.6 6.5H10.7l-1-4.2-1 4.2H7.5z"/></svg>,
  },
  {
    id: "excel", delay: "-6s",
    bg: "#217346", glow: "#217346",
    svg: <svg viewBox="0 0 24 24" fill="white" width="18" height="18"><path d="M19.5 3h-15A1.5 1.5 0 003 4.5v15A1.5 1.5 0 004.5 21h15a1.5 1.5 0 001.5-1.5v-15A1.5 1.5 0 0019.5 3zm-5 4.5h3v2h-3v-2zm0 3h3v2h-3v-2zm0 3h3v2h-3v-2zM6 7.5h5.5L14 12l-2.5 4.5H6l2.5-4.5L6 7.5z"/></svg>,
  },
  {
    id: "audiomack", delay: "-9s",
    bg: "#FF6600", glow: "#FF6600",
    svg: <svg viewBox="0 0 24 24" fill="white" width="18" height="18"><path d="M12 3a9 9 0 100 18A9 9 0 0012 3zm0 4a1 1 0 011 1v2.586l1.707 1.707a1 1 0 01-1.414 1.414l-2-2A1 1 0 0111 11V8a1 1 0 011-1z"/></svg>,
  },
  {
    id: "boomplay", delay: "-12s",
    bg: "#1FC36A", glow: "#1FC36A",
    svg: <svg viewBox="0 0 24 24" fill="white" width="18" height="18"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/></svg>,
  },
  {
    id: "twitter-x", delay: "-15s",
    bg: "#000000", glow: "#888888",
    svg: <svg viewBox="0 0 24 24" fill="white" width="17" height="17"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>,
  },
  {
    id: "whatsapp", delay: "-18s",
    bg: "#25D366", glow: "#25D366",
    svg: <svg viewBox="0 0 24 24" fill="white" width="19" height="19"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>,
  },
  {
    id: "phonebook", delay: "-21s",
    bg: "#4F46E5", glow: "#4F46E5",
    svg: <svg viewBox="0 0 24 24" fill="white" width="18" height="18"><path d="M20 4H4a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V6a2 2 0 00-2-2zm-8 3a3 3 0 110 6 3 3 0 010-6zm6 10H6v-.6c0-2 4-3.1 6-3.1s6 1.1 6 3.1v.6z"/></svg>,
  },
  {
    id: "media", delay: "-24s",
    bg: "#7C3AED", glow: "#7C3AED",
    svg: <svg viewBox="0 0 24 24" fill="white" width="18" height="18"><path d="M4 6a2 2 0 012-2h12a2 2 0 012 2v3h1a1 1 0 010 2h-1v3a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm8 1a4 4 0 100 8 4 4 0 000-8zm0 2a2 2 0 110 4 2 2 0 010-4zM5 8H3a1 1 0 000 2h2V8zm16 0h-2v2h2V8z"/></svg>,
  },
  {
    id: "supabase", delay: "-27s",
    bg: "#3ECF8E", glow: "#3ECF8E",
    svg: <svg viewBox="0 0 24 24" fill="white" width="18" height="18"><path d="M11.9 1.036c-.015-.986-1.26-1.41-1.874-.637L.764 12.05C.111 12.888.706 14.1 1.75 14.1h9.16l.234 8.864c.015.986 1.26 1.41 1.874.637l9.262-11.652c.653-.837.059-2.05-.985-2.05h-9.16L11.9 1.036z"/></svg>,
  },
] as const;

// ── ROSTER dashboard mockup (background) ────────────────────────────────
function DashboardMock() {
  const artists = [
    { name: "Amara Nwosu", genre: "Afrobeats", streams: "2.4M", trend: "+12%" },
    { name: "Kelvin Dube",  genre: "Amapiano",  streams: "890K", trend: "+8%"  },
    { name: "Zara Mensah",  genre: "R&B",       streams: "1.1M", trend: "+21%" },
  ];
  return (
    <div className="flex h-full text-left" style={{ fontSize: 11, color: "#F1F5F9" }}>
      {/* Sidebar */}
      <div className="flex-shrink-0 flex flex-col gap-1 py-4 px-3 border-r"
        style={{ width: 148, background: "#0D1117", borderColor: "#1F2937" }}>
        <div className="flex items-center gap-2 mb-4 px-1">
          <div className="w-6 h-6 rounded flex items-center justify-center text-[10px] font-black"
            style={{ background: "linear-gradient(135deg,#C9A84C,#F59E0B)", color: "#000" }}>R</div>
          <span className="font-black text-xs" style={{ color: "#C9A84C" }}>ROSTER</span>
        </div>
        {[
          { label: "Dashboard",   active: true  },
          { label: "Toolkit",     active: false },
          { label: "Experts",     active: false },
          { label: "ROSTER AI",   active: false },
          { label: "Masterclass", active: false },
          { label: "Learn",       active: false },
          { label: "Directory",   active: false },
        ].map(({ label, active }) => (
          <div key={label} className="px-2 py-1.5 rounded text-[10px] font-semibold"
            style={{ background: active ? "rgba(201,168,76,0.12)" : "transparent", color: active ? "#C9A84C" : "#64748B" }}>
            {label}
          </div>
        ))}
      </div>
      {/* Main */}
      <div className="flex-1 overflow-hidden flex flex-col" style={{ background: "#080B14" }}>
        <div className="flex items-center justify-between px-5 py-3 border-b flex-shrink-0" style={{ borderColor: "#1F2937" }}>
          <div>
            <p className="text-[9px] font-semibold" style={{ color: "#64748B" }}>GOOD MORNING</p>
            <p className="text-xs font-black" style={{ color: "#F1F5F9" }}>Your Roster</p>
          </div>
          <div className="text-[9px] font-bold px-2 py-1 rounded-full" style={{ background: "rgba(201,168,76,0.15)", color: "#C9A84C" }}>Pro Plan</div>
        </div>
        <div className="grid grid-cols-3 gap-2 px-5 pt-3 pb-2 flex-shrink-0">
          {[
            { label: "Artists",   value: "3",       sub: "Active" },
            { label: "Streams",   value: "4.4M",    sub: "This month" },
            { label: "Contracts", value: "R45,200", sub: "In play" },
          ].map(({ label, value, sub }) => (
            <div key={label} className="rounded-lg p-2" style={{ background: "#111827", border: "1px solid #1F2937" }}>
              <p className="text-[8px] font-semibold uppercase tracking-wide" style={{ color: "#64748B" }}>{label}</p>
              <p className="text-sm font-black mt-0.5" style={{ color: "#C9A84C" }}>{value}</p>
              <p className="text-[8px]" style={{ color: "#64748B" }}>{sub}</p>
            </div>
          ))}
        </div>
        <div className="px-5 pb-2 flex-shrink-0">
          <p className="text-[9px] font-bold uppercase tracking-widest mb-2" style={{ color: "#64748B" }}>Artist Roster</p>
          <div className="flex flex-col gap-1.5">
            {artists.map((a) => (
              <div key={a.name} className="flex items-center justify-between rounded-lg px-3 py-2"
                style={{ background: "#111827", border: "1px solid #1F2937" }}>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-black"
                    style={{ background: "rgba(201,168,76,0.2)", color: "#C9A84C" }}>{a.name[0]}</div>
                  <div>
                    <p className="text-[10px] font-bold" style={{ color: "#F1F5F9" }}>{a.name}</p>
                    <p className="text-[8px]" style={{ color: "#64748B" }}>{a.genre}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold" style={{ color: "#F1F5F9" }}>{a.streams}</p>
                  <p className="text-[8px] font-semibold" style={{ color: "#22C55E" }}>{a.trend}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="px-5 pt-1 flex-shrink-0">
          <div className="rounded-lg px-3 py-2 flex items-start gap-2"
            style={{ background: "rgba(201,168,76,0.06)", border: "1px solid rgba(201,168,76,0.15)" }}>
            <div className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(201,168,76,0.2)", fontSize: 10 }}>✦</div>
            <div>
              <p className="text-[9px] font-bold" style={{ color: "#C9A84C" }}>ROSTER AI</p>
              <p className="text-[9px]" style={{ color: "#94A3B8" }}>
                Amara&apos;s streams are up 12% — good time to pitch to Spotify editorial.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main exported component ──────────────────────────────────────────────
export function HeroAnimation() {

  return (
    <div
      className="relative w-full overflow-hidden"
      style={{ height: 540, width: "100%", margin: "40px auto 0" }}
      aria-hidden="true"
    >
      {/* ── 1. Background: ROSTER dashboard window (dimmed) ────── */}
      <div
        className="absolute rounded-2xl overflow-hidden"
        style={{
          top: 16, right: 16, bottom: 16, left: 16,
          border: "1px solid rgba(201,168,76,0.15)",
          boxShadow: "0 32px 80px rgba(0,0,0,0.6)",
          opacity: 0.45,
          animation: "windowFloat 8s ease-in-out infinite",
          zIndex: 2,
        }}
      >
        {/* Browser chrome */}
        <div className="flex items-center gap-1.5 px-4 flex-shrink-0"
          style={{ height: 34, background: "#0D1117", borderBottom: "1px solid #1F2937" }}>
          <div className="w-3 h-3 rounded-full" style={{ background: "#FF5F57" }} />
          <div className="w-3 h-3 rounded-full" style={{ background: "#FEBC2E" }} />
          <div className="w-3 h-3 rounded-full" style={{ background: "#28C840" }} />
          <div className="flex-1 mx-3 rounded text-center text-[9px]"
            style={{ background: "#111827", color: "#64748B", padding: "2px 8px", maxWidth: 200, margin: "0 auto" }}>
            rosterapp.ai/dashboard
          </div>
        </div>
        <div style={{ height: "calc(100% - 34px)" }}>
          <DashboardMock />
        </div>
      </div>

      {/* ── 2. Orbit ring visuals (dashed circles) ───────────────── */}
      {[150, 232].map((r, i) => (
        <div
          key={r}
          className="absolute rounded-full pointer-events-none"
          style={{
            left: "50%", top: "50%",
            width: r * 2 + 44,
            height: r * 2 + 44,
            transform: "translate(-50%, -50%)",
            border: "1px dashed rgba(201,168,76,0.18)",
            animation: `orbitRingPulse ${3 + i}s ease-in-out ${i * 0.8}s infinite`,
            zIndex: 3,
          }}
        />
      ))}

      {/* ── 3. Inner orbit icons ──────────────────────────────────── */}
      {INNER_ICONS.map(({ id, delay, bg, glow, svg }) => (
        <div
          key={id}
          className="absolute flex items-center justify-center rounded-xl"
          style={{
            left: "calc(50% - 22px)",
            top: "calc(50% - 22px)",
            width: 44, height: 44,
            background: bg,
            boxShadow: `0 4px 16px rgba(0,0,0,0.6), 0 0 10px ${glow}55`,
            zIndex: 5,
            animation: `orbitInner 20s linear ${delay} infinite`,
          }}
        >
          {svg}
        </div>
      ))}

      {/* ── 4. Outer orbit icons ──────────────────────────────────── */}
      {OUTER_ICONS.map(({ id, delay, bg, glow, svg }) => (
        <div
          key={id}
          className="absolute flex items-center justify-center rounded-xl"
          style={{
            left: "calc(50% - 22px)",
            top: "calc(50% - 22px)",
            width: 44, height: 44,
            background: bg,
            boxShadow: `0 4px 16px rgba(0,0,0,0.6), 0 0 10px ${glow}55`,
            zIndex: 5,
            animation: `orbitOuter 30s linear ${delay} infinite`,
          }}
        >
          {svg}
        </div>
      ))}

      {/* ── 5. Pulsing halo rings at centre ──────────────────────── */}
      {[80, 120].map((size, i) => (
        <div
          key={size}
          className="absolute pointer-events-none rounded-full"
          style={{
            left: "50%", top: "50%",
            width: size, height: size,
            border: `1px solid rgba(201,168,76,${i === 0 ? .45 : .2})`,
            animation: `rosterPulse${i === 1 ? "2" : ""} ${2.8 + i * 0.9}s ease-in-out ${i * 0.5}s infinite`,
            zIndex: 8,
          }}
        />
      ))}

      {/* ── 6. ROSTER centre logo ─────────────────────────────────── */}
      <div
        className="absolute flex flex-col items-center"
        style={{
          left: "50%", top: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 10,
        }}
      >
        {/* R square */}
        <div
          className="flex items-center justify-center rounded-xl font-black mb-2"
          style={{
            width: 48, height: 48,
            background: "linear-gradient(135deg,#C9A84C,#F59E0B)",
            color: "#000",
            fontSize: 24,
            animation: "rosterLogoGlow 3s ease-in-out infinite",
          }}
        >
          R
        </div>
        {/* ROSTER wordmark */}
        <p
          className="font-black uppercase tracking-widest"
          style={{ fontSize: 13, color: "#C9A84C", letterSpacing: "0.22em" }}
        >
          ROSTER
        </p>
      </div>
    </div>
  );
}
