"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import {
  ChevronLeft, ChevronRight, FileText, RotateCcw, Sparkles,
  Loader2, AlertCircle, Check
} from "lucide-react";
import { loadFullContext } from "@/lib/artist-context";
import { SaveButton } from "@/components/ui/save-button";
import { ExportButton } from "@/components/ui/export-button";

const STORAGE_KEY = "roster_one_sheet_v1";
const COLOR = "#8B5CF6";

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = "form" | "preview";
type Template = "dark-editorial" | "clean-minimal" | "bold-graphic";

// ─── Style helpers ────────────────────────────────────────────────────────────

const inputBase =
  "bg-transparent border-b border-border focus:border-brand text-sm text-text-primary placeholder:text-text-muted focus:outline-none w-full py-1 transition-colors";
const labelCls =
  "text-[10px] font-black uppercase tracking-wider text-text-muted block mb-1";
const textareaBase =
  "bg-transparent border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand w-full resize-none";

// ─── Default data ─────────────────────────────────────────────────────────────

const DEFAULT: Record<string, string> = {
  artist_name: "", genre: "", location: "", bio: "",
  stat_streams: "", stat_listeners: "", stat_followers: "",
  highlight_1: "", highlight_2: "", highlight_3: "", highlight_4: "",
  ig: "", tiktok: "", spotify: "", apple: "", youtube: "",
  manager_name: "", manager_email: "", manager_phone: "", label: "",
  release_1_title: "", release_1_year: "", release_1_type: "", release_1_streams: "",
  release_2_title: "", release_2_year: "", release_2_type: "", release_2_streams: "",
  release_3_title: "", release_3_year: "", release_3_type: "", release_3_streams: "",
  live_1: "", live_2: "", live_3: "", live_4: "",
  brand_1: "", brand_2: "", brand_3: "",
  press_1: "", press_1_source: "", press_2: "", press_2_source: "",
};

// ─── Print helper ─────────────────────────────────────────────────────────────

function printOneSheet(previewRef: React.RefObject<HTMLDivElement | null>) {
  if (!previewRef.current) return;
  const html = previewRef.current.innerHTML;
  const win = window.open("", "_blank", "width=900,height=1200");
  if (!win) return;
  win.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8">
<title>Artist One Sheet</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700;900&family=Space+Grotesk:wght@400;600;700&display=swap" rel="stylesheet">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #fff; font-family: 'Inter', system-ui, sans-serif; }
  @page { size: A4 portrait; margin: 0; }
  @media print { html, body { width: 210mm; height: 297mm; } }
</style>
</head><body>${html}</body></html>`);
  win.document.close();
  win.addEventListener("load", () => setTimeout(() => win.print(), 400));
}

// ─── TEMPLATE 1: DARK EDITORIAL ──────────────────────────────────────────────

function DarkEditorialTemplate({ d }: { d: Record<string, string> }) {
  const gold = "#C8860A";
  const goldLight = "#E8A020";
  const navy = "#0D0D1A";
  const navyLight = "#12152A";

  const highlights = [d.highlight_1, d.highlight_2, d.highlight_3, d.highlight_4].filter(Boolean);
  const releases = [
    { title: d.release_1_title, year: d.release_1_year, type: d.release_1_type, streams: d.release_1_streams },
    { title: d.release_2_title, year: d.release_2_year, type: d.release_2_type, streams: d.release_2_streams },
    { title: d.release_3_title, year: d.release_3_year, type: d.release_3_type, streams: d.release_3_streams },
  ].filter(r => r.title);
  const liveShows = [d.live_1, d.live_2, d.live_3, d.live_4].filter(Boolean);
  const brands = [d.brand_1, d.brand_2, d.brand_3].filter(Boolean);

  return (
    <div style={{ width: "794px", minHeight: "1123px", background: navy, fontFamily: "'Inter', system-ui, sans-serif", color: "#F1F5F9", position: "relative", overflow: "hidden" }}>
      {/* Top bar */}
      <div style={{ height: "6px", background: `linear-gradient(90deg, ${gold}, ${goldLight}, ${gold})` }} />

      {/* Header */}
      <div style={{ padding: "36px 48px 28px", borderBottom: `1px solid rgba(200,134,10,0.2)` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: gold, marginBottom: "6px" }}>ARTIST ONE SHEET</p>
            <h1 style={{ fontSize: "44px", fontWeight: 900, lineHeight: 1, color: "#FFFFFF", letterSpacing: "-0.02em" }}>
              {d.artist_name || "ARTIST NAME"}
            </h1>
            <p style={{ fontSize: "13px", color: "rgba(241,245,249,0.55)", marginTop: "7px", fontWeight: 600 }}>
              {[d.genre, d.location].filter(Boolean).join("  ·  ") || "Genre  ·  Location"}
            </p>
          </div>
          <div style={{ width: "110px", height: "110px", borderRadius: "8px", background: navyLight, border: `2px solid rgba(200,134,10,0.3)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <p style={{ fontSize: "9px", color: "rgba(241,245,249,0.25)", textAlign: "center", lineHeight: 1.5 }}>ARTIST<br/>PHOTO</p>
          </div>
        </div>
      </div>

      {/* Bio */}
      {d.bio && (
        <div style={{ padding: "20px 48px 0" }}>
          <p style={{ fontSize: "13px", lineHeight: 1.75, color: "rgba(241,245,249,0.72)", maxWidth: "620px" }}>{d.bio}</p>
        </div>
      )}

      {/* Stats */}
      {(d.stat_streams || d.stat_listeners || d.stat_followers) && (
        <div style={{ padding: "18px 48px", display: "flex", gap: "14px" }}>
          {[{ label: "STREAMS", val: d.stat_streams }, { label: "MONTHLY LISTENERS", val: d.stat_listeners }, { label: "TOTAL FOLLOWERS", val: d.stat_followers }]
            .filter(s => s.val)
            .map(s => (
              <div key={s.label} style={{ flex: 1, background: "rgba(200,134,10,0.08)", border: "1px solid rgba(200,134,10,0.25)", borderRadius: "10px", padding: "14px 16px" }}>
                <p style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.15em", color: gold, textTransform: "uppercase", marginBottom: "4px" }}>{s.label}</p>
                <p style={{ fontSize: "22px", fontWeight: 900, color: "#FFFFFF", letterSpacing: "-0.02em" }}>{s.val}</p>
              </div>
            ))}
        </div>
      )}

      {/* Two-column: Highlights + Socials */}
      <div style={{ padding: "0 48px 20px", display: "flex", gap: "28px" }}>
        {highlights.length > 0 && (
          <div style={{ flex: 2 }}>
            <p style={{ fontSize: "9px", fontWeight: 900, letterSpacing: "0.22em", textTransform: "uppercase", color: gold, marginBottom: "10px" }}>HIGHLIGHTS</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
              {highlights.map((h, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                  <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: gold, flexShrink: 0, marginTop: "6px" }} />
                  <p style={{ fontSize: "12.5px", color: "rgba(241,245,249,0.82)", lineHeight: 1.55 }}>{h}</p>
                </div>
              ))}
            </div>
          </div>
        )}
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: "9px", fontWeight: 900, letterSpacing: "0.22em", textTransform: "uppercase", color: gold, marginBottom: "10px" }}>SOCIAL & STREAMING</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {[{ label: "Instagram", val: d.ig }, { label: "TikTok", val: d.tiktok }, { label: "Spotify", val: d.spotify }, { label: "Apple Music", val: d.apple }, { label: "YouTube", val: d.youtube }]
              .filter(s => s.val)
              .map(s => (
                <div key={s.label} style={{ display: "flex", justifyContent: "space-between", gap: "8px" }}>
                  <p style={{ fontSize: "9px", color: "rgba(241,245,249,0.35)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", flexShrink: 0 }}>{s.label}</p>
                  <p style={{ fontSize: "11px", color: "rgba(241,245,249,0.78)", textAlign: "right" }}>{s.val}</p>
                </div>
              ))}
          </div>
        </div>
      </div>

      <div style={{ margin: "0 48px", height: "1px", background: "rgba(200,134,10,0.2)" }} />

      {/* Discography */}
      {releases.length > 0 && (
        <div style={{ padding: "16px 48px" }}>
          <p style={{ fontSize: "9px", fontWeight: 900, letterSpacing: "0.22em", textTransform: "uppercase", color: gold, marginBottom: "10px" }}>DISCOGRAPHY</p>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(200,134,10,0.2)" }}>
                {["TITLE", "TYPE", "YEAR", "STREAMS / CHART"].map(h => (
                  <th key={h} style={{ textAlign: "left", padding: "4px 8px", fontSize: "8px", fontWeight: 700, letterSpacing: "0.12em", color: "rgba(241,245,249,0.35)", textTransform: "uppercase" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {releases.map((r, i) => (
                <tr key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.02)" }}>
                  <td style={{ padding: "8px 8px", fontSize: "12px", fontWeight: 700, color: "#F1F5F9" }}>{r.title}</td>
                  <td style={{ padding: "8px 8px", fontSize: "11px", color: gold }}>{r.type}</td>
                  <td style={{ padding: "8px 8px", fontSize: "11px", color: "rgba(241,245,249,0.55)" }}>{r.year}</td>
                  <td style={{ padding: "8px 8px", fontSize: "11px", color: "rgba(241,245,249,0.55)" }}>{r.streams}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Live + Brands */}
      {(liveShows.length > 0 || brands.length > 0) && (
        <div style={{ padding: "4px 48px 16px", display: "flex", gap: "36px" }}>
          {liveShows.length > 0 && (
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: "9px", fontWeight: 900, letterSpacing: "0.22em", textTransform: "uppercase", color: gold, marginBottom: "8px" }}>LIVE PERFORMANCES</p>
              {liveShows.map((s, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                  <div style={{ width: "4px", height: "4px", borderRadius: "50%", background: gold, flexShrink: 0 }} />
                  <p style={{ fontSize: "11.5px", color: "rgba(241,245,249,0.72)" }}>{s}</p>
                </div>
              ))}
            </div>
          )}
          {brands.length > 0 && (
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: "9px", fontWeight: 900, letterSpacing: "0.22em", textTransform: "uppercase", color: gold, marginBottom: "8px" }}>BRAND PARTNERSHIPS</p>
              {brands.map((b, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                  <div style={{ width: "4px", height: "4px", borderRadius: "50%", background: gold, flexShrink: 0 }} />
                  <p style={{ fontSize: "11.5px", color: "rgba(241,245,249,0.72)" }}>{b}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Press */}
      {(d.press_1 || d.press_2) && (
        <div style={{ padding: "0 48px 72px" }}>
          <p style={{ fontSize: "9px", fontWeight: 900, letterSpacing: "0.22em", textTransform: "uppercase", color: gold, marginBottom: "10px" }}>PRESS</p>
          <div style={{ display: "flex", gap: "16px" }}>
            {[{ q: d.press_1, src: d.press_1_source }, { q: d.press_2, src: d.press_2_source }]
              .filter(p => p.q)
              .map((p, i) => (
                <div key={i} style={{ flex: 1, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(200,134,10,0.15)", borderRadius: "8px", padding: "12px 14px" }}>
                  <p style={{ fontSize: "11.5px", fontStyle: "italic", color: "rgba(241,245,249,0.72)", lineHeight: 1.55, marginBottom: "6px" }}>&ldquo;{p.q}&rdquo;</p>
                  {p.src && <p style={{ fontSize: "9px", fontWeight: 700, color: gold, letterSpacing: "0.12em", textTransform: "uppercase" }}>{p.src}</p>}
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "12px 48px", background: "rgba(200,134,10,0.08)", borderTop: "1px solid rgba(200,134,10,0.2)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <p style={{ fontSize: "9px", fontWeight: 900, color: gold, letterSpacing: "0.18em", textTransform: "uppercase" }}>MANAGEMENT</p>
          <p style={{ fontSize: "12px", color: "rgba(241,245,249,0.82)", marginTop: "2px" }}>
            {[d.manager_name, d.manager_email, d.manager_phone].filter(Boolean).join("  ·  ") || "Manager Name  ·  email@example.com"}
          </p>
          {d.label && <p style={{ fontSize: "9px", color: "rgba(241,245,249,0.35)", marginTop: "1px" }}>{d.label}</p>}
        </div>
        <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: gold }} />
      </div>
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "4px", background: `linear-gradient(90deg, ${gold}, ${goldLight}, ${gold})` }} />
    </div>
  );
}

// ─── TEMPLATE 2: CLEAN MINIMAL ────────────────────────────────────────────────

function CleanMinimalTemplate({ d }: { d: Record<string, string> }) {
  const ink = "#111111";
  const accent = "#0066FF";
  const mid = "#555555";
  const faint = "#999999";
  const rule = "#E5E7EB";

  const highlights = [d.highlight_1, d.highlight_2, d.highlight_3, d.highlight_4].filter(Boolean);
  const releases = [
    { title: d.release_1_title, year: d.release_1_year, type: d.release_1_type, streams: d.release_1_streams },
    { title: d.release_2_title, year: d.release_2_year, type: d.release_2_type, streams: d.release_2_streams },
    { title: d.release_3_title, year: d.release_3_year, type: d.release_3_type, streams: d.release_3_streams },
  ].filter(r => r.title);
  const liveShows = [d.live_1, d.live_2, d.live_3, d.live_4].filter(Boolean);
  const brands = [d.brand_1, d.brand_2, d.brand_3].filter(Boolean);

  return (
    <div style={{ width: "794px", minHeight: "1123px", background: "#FFFFFF", fontFamily: "'Inter', system-ui, sans-serif", color: ink, position: "relative" }}>
      {/* Top accent line */}
      <div style={{ height: "3px", background: accent }} />

      {/* Header */}
      <div style={{ padding: "48px 56px 32px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: `1px solid ${rule}` }}>
        <div>
          <p style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.3em", textTransform: "uppercase", color: accent, marginBottom: "8px" }}>ARTIST ONE SHEET</p>
          <h1 style={{ fontSize: "48px", fontWeight: 900, color: ink, letterSpacing: "-0.03em", lineHeight: 1, marginBottom: "8px" }}>
            {d.artist_name || "ARTIST NAME"}
          </h1>
          <p style={{ fontSize: "13px", color: mid, fontWeight: 400 }}>
            {[d.genre, d.location].filter(Boolean).join("  /  ") || "Genre  /  Location"}
          </p>
        </div>
        <div style={{ width: "100px", height: "100px", borderRadius: "4px", background: "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <p style={{ fontSize: "9px", color: "#CCCCCC", textAlign: "center", lineHeight: 1.5 }}>ARTIST<br/>PHOTO</p>
        </div>
      </div>

      {/* Bio */}
      {d.bio && (
        <div style={{ padding: "28px 56px 0" }}>
          <p style={{ fontSize: "13px", lineHeight: 1.8, color: mid, maxWidth: "580px" }}>{d.bio}</p>
        </div>
      )}

      {/* Stats */}
      {(d.stat_streams || d.stat_listeners || d.stat_followers) && (
        <div style={{ padding: "24px 56px", display: "flex", gap: "0", borderBottom: `1px solid ${rule}`, borderTop: `1px solid ${rule}`, marginTop: "24px" }}>
          {[{ label: "STREAMS", val: d.stat_streams }, { label: "MONTHLY LISTENERS", val: d.stat_listeners }, { label: "TOTAL FOLLOWERS", val: d.stat_followers }]
            .filter(s => s.val)
            .map((s, i, arr) => (
              <div key={s.label} style={{ flex: 1, paddingLeft: i > 0 ? "28px" : "0", borderLeft: i > 0 ? `1px solid ${rule}` : "none", marginLeft: i > 0 ? "28px" : "0" }}>
                <p style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.2em", color: faint, textTransform: "uppercase", marginBottom: "4px" }}>{s.label}</p>
                <p style={{ fontSize: "26px", fontWeight: 900, color: ink, letterSpacing: "-0.02em" }}>{s.val}</p>
              </div>
            ))}
        </div>
      )}

      {/* Content grid */}
      <div style={{ padding: "28px 56px", display: "flex", gap: "48px" }}>
        {/* Left column */}
        <div style={{ flex: 3 }}>
          {highlights.length > 0 && (
            <div style={{ marginBottom: "28px" }}>
              <p style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.3em", textTransform: "uppercase", color: accent, marginBottom: "14px" }}>HIGHLIGHTS</p>
              {highlights.map((h, i) => (
                <div key={i} style={{ display: "flex", gap: "12px", marginBottom: "8px", alignItems: "flex-start" }}>
                  <span style={{ color: accent, fontSize: "13px", flexShrink: 0, lineHeight: 1.5 }}>—</span>
                  <p style={{ fontSize: "12.5px", color: mid, lineHeight: 1.6 }}>{h}</p>
                </div>
              ))}
            </div>
          )}

          {releases.length > 0 && (
            <div style={{ marginBottom: "28px" }}>
              <p style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.3em", textTransform: "uppercase", color: accent, marginBottom: "14px" }}>DISCOGRAPHY</p>
              {releases.map((r, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "8px 0", borderBottom: `1px solid ${rule}` }}>
                  <p style={{ fontSize: "12.5px", fontWeight: 600, color: ink }}>{r.title}</p>
                  <div style={{ display: "flex", gap: "16px", alignItems: "baseline" }}>
                    {r.type && <p style={{ fontSize: "10px", color: accent, fontWeight: 600 }}>{r.type}</p>}
                    {r.year && <p style={{ fontSize: "10px", color: faint }}>{r.year}</p>}
                    {r.streams && <p style={{ fontSize: "10px", color: mid }}>{r.streams}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {liveShows.length > 0 && (
            <div>
              <p style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.3em", textTransform: "uppercase", color: accent, marginBottom: "14px" }}>LIVE PERFORMANCES</p>
              {liveShows.map((s, i) => (
                <p key={i} style={{ fontSize: "12px", color: mid, marginBottom: "5px" }}>{s}</p>
              ))}
            </div>
          )}
        </div>

        {/* Right column */}
        <div style={{ flex: 2 }}>
          <div style={{ marginBottom: "24px" }}>
            <p style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.3em", textTransform: "uppercase", color: accent, marginBottom: "14px" }}>SOCIAL & STREAMING</p>
            {[{ label: "Instagram", val: d.ig }, { label: "TikTok", val: d.tiktok }, { label: "Spotify", val: d.spotify }, { label: "Apple Music", val: d.apple }, { label: "YouTube", val: d.youtube }]
              .filter(s => s.val)
              .map(s => (
                <div key={s.label} style={{ marginBottom: "7px" }}>
                  <p style={{ fontSize: "9px", color: faint, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "1px" }}>{s.label}</p>
                  <p style={{ fontSize: "11.5px", color: mid }}>{s.val}</p>
                </div>
              ))}
          </div>

          {brands.length > 0 && (
            <div style={{ marginBottom: "24px" }}>
              <p style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.3em", textTransform: "uppercase", color: accent, marginBottom: "14px" }}>BRAND PARTNERSHIPS</p>
              {brands.map((b, i) => (
                <p key={i} style={{ fontSize: "12px", color: mid, marginBottom: "5px" }}>{b}</p>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Press */}
      {(d.press_1 || d.press_2) && (
        <div style={{ padding: "0 56px 80px" }}>
          <p style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.3em", textTransform: "uppercase", color: accent, marginBottom: "14px" }}>PRESS</p>
          <div style={{ display: "flex", gap: "20px" }}>
            {[{ q: d.press_1, src: d.press_1_source }, { q: d.press_2, src: d.press_2_source }]
              .filter(p => p.q)
              .map((p, i) => (
                <div key={i} style={{ flex: 1, borderLeft: `3px solid ${accent}`, paddingLeft: "14px" }}>
                  <p style={{ fontSize: "12px", fontStyle: "italic", color: mid, lineHeight: 1.6, marginBottom: "6px" }}>&ldquo;{p.q}&rdquo;</p>
                  {p.src && <p style={{ fontSize: "9px", fontWeight: 700, color: accent, letterSpacing: "0.12em", textTransform: "uppercase" }}>{p.src}</p>}
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "14px 56px", borderTop: `1px solid ${rule}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <p style={{ fontSize: "11px", fontWeight: 700, color: ink, marginBottom: "2px" }}>
            {d.manager_name || "Management"} — {d.manager_email || "email@example.com"}
            {d.manager_phone ? `  ·  ${d.manager_phone}` : ""}
          </p>
          {d.label && <p style={{ fontSize: "10px", color: faint }}>{d.label}</p>}
        </div>
        <div style={{ width: "24px", height: "3px", background: accent }} />
      </div>
    </div>
  );
}

// ─── TEMPLATE 3: BOLD GRAPHIC ─────────────────────────────────────────────────

function BoldGraphicTemplate({ d }: { d: Record<string, string> }) {
  const bg = "#0A0A0A";
  const lime = "#CCFF00";
  const white = "#FFFFFF";
  const dimWhite = "rgba(255,255,255,0.55)";
  const panel = "rgba(255,255,255,0.04)";
  const border = "rgba(255,255,255,0.08)";

  const highlights = [d.highlight_1, d.highlight_2, d.highlight_3, d.highlight_4].filter(Boolean);
  const releases = [
    { title: d.release_1_title, year: d.release_1_year, type: d.release_1_type, streams: d.release_1_streams },
    { title: d.release_2_title, year: d.release_2_year, type: d.release_2_type, streams: d.release_2_streams },
    { title: d.release_3_title, year: d.release_3_year, type: d.release_3_type, streams: d.release_3_streams },
  ].filter(r => r.title);
  const liveShows = [d.live_1, d.live_2, d.live_3, d.live_4].filter(Boolean);
  const brands = [d.brand_1, d.brand_2, d.brand_3].filter(Boolean);

  return (
    <div style={{ width: "794px", minHeight: "1123px", background: bg, fontFamily: "'Inter', system-ui, sans-serif", color: white, position: "relative", overflow: "hidden" }}>
      {/* Decorative background circle */}
      <div style={{ position: "absolute", top: "-80px", right: "-80px", width: "320px", height: "320px", borderRadius: "50%", background: `${lime}08`, pointerEvents: "none" }} />

      {/* Header block */}
      <div style={{ padding: "0", background: "transparent" }}>
        {/* Top label bar */}
        <div style={{ padding: "16px 48px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <p style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.35em", textTransform: "uppercase", color: lime }}>ARTIST ONE SHEET</p>
          <p style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: dimWhite }}>2026</p>
        </div>

        {/* Artist name — full-width hero */}
        <div style={{ padding: "8px 48px 24px", borderBottom: `1px solid ${border}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <div>
              <h1 style={{ fontSize: "58px", fontWeight: 900, lineHeight: 1, color: white, letterSpacing: "-0.03em", marginBottom: "10px" }}>
                {d.artist_name || "ARTIST NAME"}
              </h1>
              <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                {d.genre && (
                  <span style={{ fontSize: "11px", fontWeight: 700, padding: "4px 10px", background: lime, color: bg, borderRadius: "3px", letterSpacing: "0.05em" }}>
                    {d.genre}
                  </span>
                )}
                {d.location && <p style={{ fontSize: "12px", color: dimWhite }}>{d.location}</p>}
              </div>
            </div>
            <div style={{ width: "100px", height: "100px", borderRadius: "4px", background: "rgba(255,255,255,0.06)", border: `1px solid ${border}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <p style={{ fontSize: "9px", color: "rgba(255,255,255,0.2)", textAlign: "center", lineHeight: 1.5 }}>ARTIST<br/>PHOTO</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bio */}
      {d.bio && (
        <div style={{ padding: "22px 48px 0" }}>
          <p style={{ fontSize: "13px", lineHeight: 1.75, color: "rgba(255,255,255,0.68)", maxWidth: "600px" }}>{d.bio}</p>
        </div>
      )}

      {/* Stats — large numbers */}
      {(d.stat_streams || d.stat_listeners || d.stat_followers) && (
        <div style={{ padding: "22px 48px", display: "flex", gap: "2px" }}>
          {[{ label: "STREAMS", val: d.stat_streams }, { label: "MONTHLY LISTENERS", val: d.stat_listeners }, { label: "TOTAL FOLLOWERS", val: d.stat_followers }]
            .filter(s => s.val)
            .map(s => (
              <div key={s.label} style={{ flex: 1, background: panel, border: `1px solid ${border}`, padding: "16px 18px", marginRight: "2px" }}>
                <p style={{ fontSize: "8px", fontWeight: 900, letterSpacing: "0.25em", color: lime, textTransform: "uppercase", marginBottom: "6px" }}>{s.label}</p>
                <p style={{ fontSize: "24px", fontWeight: 900, color: white, letterSpacing: "-0.02em" }}>{s.val}</p>
              </div>
            ))}
        </div>
      )}

      {/* Two columns */}
      <div style={{ padding: "4px 48px 20px", display: "flex", gap: "24px" }}>
        <div style={{ flex: 2 }}>
          {highlights.length > 0 && (
            <div style={{ marginBottom: "20px" }}>
              <p style={{ fontSize: "8px", fontWeight: 900, letterSpacing: "0.35em", textTransform: "uppercase", color: lime, marginBottom: "12px" }}>HIGHLIGHTS</p>
              {highlights.map((h, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "10px", marginBottom: "8px" }}>
                  <span style={{ color: lime, fontSize: "14px", flexShrink: 0, lineHeight: 1.4 }}>+</span>
                  <p style={{ fontSize: "12.5px", color: "rgba(255,255,255,0.78)", lineHeight: 1.55 }}>{h}</p>
                </div>
              ))}
            </div>
          )}

          {releases.length > 0 && (
            <div>
              <p style={{ fontSize: "8px", fontWeight: 900, letterSpacing: "0.35em", textTransform: "uppercase", color: lime, marginBottom: "12px" }}>DISCOGRAPHY</p>
              {releases.map((r, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "9px 12px", background: i % 2 === 0 ? panel : "transparent", borderLeft: i % 2 === 0 ? `2px solid ${lime}` : "2px solid transparent", marginBottom: "2px" }}>
                  <p style={{ fontSize: "12px", fontWeight: 700, color: white }}>{r.title}</p>
                  <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                    {r.type && <p style={{ fontSize: "10px", color: lime, fontWeight: 700 }}>{r.type}</p>}
                    {r.year && <p style={{ fontSize: "10px", color: dimWhite }}>{r.year}</p>}
                    {r.streams && <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.55)" }}>{r.streams}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ flex: 1 }}>
          <p style={{ fontSize: "8px", fontWeight: 900, letterSpacing: "0.35em", textTransform: "uppercase", color: lime, marginBottom: "12px" }}>SOCIAL & STREAMING</p>
          {[{ label: "IG", val: d.ig }, { label: "TT", val: d.tiktok }, { label: "SP", val: d.spotify }, { label: "AM", val: d.apple }, { label: "YT", val: d.youtube }]
            .filter(s => s.val)
            .map(s => (
              <div key={s.label} style={{ display: "flex", gap: "10px", alignItems: "baseline", marginBottom: "7px" }}>
                <p style={{ fontSize: "8px", fontWeight: 900, color: lime, width: "18px", flexShrink: 0, letterSpacing: "0.1em" }}>{s.label}</p>
                <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.7)" }}>{s.val}</p>
              </div>
            ))}

          {(liveShows.length > 0 || brands.length > 0) && (
            <div style={{ marginTop: "20px" }}>
              {liveShows.length > 0 && (
                <>
                  <p style={{ fontSize: "8px", fontWeight: 900, letterSpacing: "0.35em", textTransform: "uppercase", color: lime, marginBottom: "10px", marginTop: "16px" }}>LIVE</p>
                  {liveShows.map((s, i) => <p key={i} style={{ fontSize: "11px", color: dimWhite, marginBottom: "4px" }}>{s}</p>)}
                </>
              )}
              {brands.length > 0 && (
                <>
                  <p style={{ fontSize: "8px", fontWeight: 900, letterSpacing: "0.35em", textTransform: "uppercase", color: lime, marginBottom: "10px", marginTop: "16px" }}>BRANDS</p>
                  {brands.map((b, i) => <p key={i} style={{ fontSize: "11px", color: dimWhite, marginBottom: "4px" }}>{b}</p>)}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Press */}
      {(d.press_1 || d.press_2) && (
        <div style={{ padding: "0 48px 72px" }}>
          <p style={{ fontSize: "8px", fontWeight: 900, letterSpacing: "0.35em", textTransform: "uppercase", color: lime, marginBottom: "12px" }}>PRESS</p>
          <div style={{ display: "flex", gap: "16px" }}>
            {[{ q: d.press_1, src: d.press_1_source }, { q: d.press_2, src: d.press_2_source }]
              .filter(p => p.q)
              .map((p, i) => (
                <div key={i} style={{ flex: 1, background: panel, border: `1px solid ${border}`, borderTop: `2px solid ${lime}`, padding: "12px 14px" }}>
                  <p style={{ fontSize: "11.5px", fontStyle: "italic", color: "rgba(255,255,255,0.68)", lineHeight: 1.55, marginBottom: "6px" }}>&ldquo;{p.q}&rdquo;</p>
                  {p.src && <p style={{ fontSize: "8px", fontWeight: 900, color: lime, letterSpacing: "0.15em", textTransform: "uppercase" }}>{p.src}</p>}
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "12px 48px", borderTop: `1px solid ${border}`, display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(0,0,0,0.5)" }}>
        <div>
          <p style={{ fontSize: "11px", fontWeight: 700, color: white, marginBottom: "2px" }}>
            {[d.manager_name, d.manager_email, d.manager_phone].filter(Boolean).join("  ·  ") || "Manager Name  ·  email@example.com"}
          </p>
          {d.label && <p style={{ fontSize: "9px", color: dimWhite }}>{d.label}</p>}
        </div>
        <div style={{ width: "20px", height: "2px", background: lime }} />
      </div>
    </div>
  );
}

// ─── Template config ──────────────────────────────────────────────────────────

const TEMPLATES: { id: Template; label: string; desc: string; bg: string; accent: string }[] = [
  { id: "dark-editorial", label: "Dark Editorial", desc: "Navy canvas, gold accents", bg: "#0D0D1A", accent: "#C8860A" },
  { id: "clean-minimal",  label: "Clean Minimal",  desc: "White, blue lines",       bg: "#FFFFFF", accent: "#0066FF" },
  { id: "bold-graphic",   label: "Bold Graphic",   desc: "Black, lime highlights",  bg: "#0A0A0A", accent: "#CCFF00" },
];

function TemplatePreview({ id, bg, accent }: { id: Template; bg: string; accent: string }) {
  return (
    <div style={{ width: "100%", aspectRatio: "1/1.414", background: bg, borderRadius: "6px", overflow: "hidden", position: "relative", display: "flex", flexDirection: "column", padding: "12px 14px", gap: "6px" }}>
      <div style={{ height: "2px", background: accent, marginBottom: "2px" }} />
      <div style={{ width: "60%", height: "8px", background: accent, borderRadius: "2px", opacity: 0.9 }} />
      <div style={{ width: "80%", height: "5px", background: bg === "#FFFFFF" ? "#111" : "rgba(255,255,255,0.25)", borderRadius: "2px" }} />
      <div style={{ width: "45%", height: "4px", background: bg === "#FFFFFF" ? "#888" : "rgba(255,255,255,0.15)", borderRadius: "2px" }} />
      <div style={{ display: "flex", gap: "4px", marginTop: "4px" }}>
        {[40, 35, 38].map((w, i) => (
          <div key={i} style={{ flex: w, height: "18px", background: accent, borderRadius: "3px", opacity: 0.15 }} />
        ))}
      </div>
      <div style={{ marginTop: "4px", display: "flex", flexDirection: "column", gap: "3px" }}>
        {[70, 55, 65].map((w, i) => (
          <div key={i} style={{ width: `${w}%`, height: "3px", background: bg === "#FFFFFF" ? "#E5E7EB" : "rgba(255,255,255,0.1)", borderRadius: "2px" }} />
        ))}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function OneSheetPage() {
  const handleExportPDF = () => { window.print(); };
  const [tab, setTab] = useState<Tab>("form");
  const [template, setTemplate] = useState<Template>("dark-editorial");
  const [data, setData] = useState<Record<string, string>>(DEFAULT);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiDone, setAiDone] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  // Load from localStorage / server + Brand Book on mount
  useEffect(() => {
    const applyCtx = () => {
      const ctx = loadFullContext();
      if (ctx) {
        setData(prev => {
          const next = { ...prev };
          if (!prev.artist_name && ctx.artistName) next.artist_name = ctx.artistName;
          if (!prev.genre && ctx.genre) next.genre = ctx.genre;
          if (!prev.manager_name && ctx.managerName) next.manager_name = ctx.managerName;
          if (!prev.manager_email && ctx.managerEmail) next.manager_email = ctx.managerEmail;
          if (!prev.stat_streams && ctx.streamingNumbers) next.stat_streams = ctx.streamingNumbers;
          if (!prev.ig && ctx.artistName) next.ig = `@${ctx.artistName.toLowerCase().replace(/\s+/g, "")}`;
          return next;
        });
      }
    };

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        setData({ ...DEFAULT, ...JSON.parse(raw) });
        applyCtx();
        return;
      }
    } catch {}

    applyCtx();
    fetch(`/api/tools/save?slug=one-sheet`)
      .then(r => r.json())
      .then(({ snapshot }) => {
        if (!snapshot?.data) return;
        const d = snapshot.data as Record<string, string>;
        setData({ ...DEFAULT, ...d });
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); } catch {}
      })
      .catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const set = useCallback((key: string, val: string) => {
    setData(d => {
      const next = { ...d, [key]: val };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const v = (key: string) => data[key] || "";

  const handleReset = () => {
    if (confirm("Clear all one sheet data? This cannot be undone.")) {
      setData(DEFAULT);
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const handleExport = () => printOneSheet(previewRef);

  // AI bio generation
  const generateBio = async () => {
    setAiLoading(true);
    setAiDone(false);
    try {
      const ctx = loadFullContext();
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tool: "onesheet-bio",
          artistContext: ctx,
          params: {
            template,
            additionalNotes: [
              data.stat_streams && `${data.stat_streams} streams`,
              data.highlight_1,
              data.highlight_2,
            ].filter(Boolean).join(", "),
          },
        }),
      });
      const result = await res.json();
      if (result.result) {
        set("bio", result.result.trim());
        setAiDone(true);
        setTimeout(() => setAiDone(false), 3000);
      }
    } catch {}
    finally { setAiLoading(false); }
  };

  const TABS: { id: Tab; label: string }[] = [
    { id: "form", label: "Fill In Details" },
    { id: "preview", label: "Preview & Export" },
  ];

  return (
    <div className="animate-fade-in max-w-4xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-text-muted mb-6">
          <SaveButton toolSlug="one-sheet" storageKey={STORAGE_KEY} title={`One Sheet — ${new Date().toLocaleDateString('en-ZA', { month: 'short', year: 'numeric' })}`} />
            <ExportButton onPDF={handleExportPDF} />

        <Link href="/dashboard/library" className="hover:text-text-primary transition-colors">Toolkit</Link>
        <ChevronRight size={12}/>
        <Link href="/dashboard/library/marketing" className="hover:text-text-primary transition-colors">Marketing</Link>
        <ChevronRight size={12}/>
        <span className="text-text-primary">Artist One Sheet</span>
      </div>

      {/* Header */}
      <div className="glass-card rounded-2xl p-6 mb-7" style={{ borderColor: `${COLOR}25` }}>
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${COLOR}15` }}>
            <FileText size={26} style={{ color: COLOR }}/>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold uppercase tracking-widest mb-0.5" style={{ color: COLOR }}>Marketing · Auto-Saved</p>
            <h1 className="text-2xl font-black text-text-primary mb-1">Artist One Sheet Generator</h1>
            <p className="text-sm text-text-muted">Three premium templates, AI-generated bio, auto-filled from your Brand Book. Export as PDF.</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-0 mb-8 border-b border-border">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-5 py-3 text-sm font-semibold transition-all border-b-2 -mb-px ${
              tab === t.id ? "border-brand text-brand" : "border-transparent text-text-muted hover:text-text-primary"
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── FORM TAB ── */}
      {tab === "form" && (
        <div className="space-y-5">
          {/* Artist Identity */}
          <div className="glass-card rounded-xl p-5" style={{ borderColor: `${COLOR}20` }}>
            <p className="text-xs font-black uppercase tracking-wider mb-4" style={{ color: COLOR }}>Artist Identity</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className={labelCls}>Artist / Act Name</label>
                <input type="text" value={v("artist_name")} onChange={e => set("artist_name", e.target.value)}
                  placeholder="e.g. IMARA" className={inputBase}/>
              </div>
              <div>
                <label className={labelCls}>Genre(s)</label>
                <input type="text" value={v("genre")} onChange={e => set("genre", e.target.value)}
                  placeholder="e.g. Afrobeats / R&B" className={inputBase}/>
              </div>
              <div>
                <label className={labelCls}>Location</label>
                <input type="text" value={v("location")} onChange={e => set("location", e.target.value)}
                  placeholder="e.g. Johannesburg, South Africa" className={inputBase}/>
              </div>
              <div className="sm:col-span-2">
                <div className="flex items-center justify-between mb-1">
                  <label className={labelCls}>Bio (2–3 sentences)</label>
                  <button
                    onClick={generateBio}
                    disabled={aiLoading}
                    className="flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-lg transition-all hover:opacity-80 disabled:opacity-50"
                    style={{ backgroundColor: `${COLOR}15`, color: COLOR }}
                  >
                    {aiLoading ? <Loader2 size={11} className="animate-spin"/> : aiDone ? <Check size={11}/> : <Sparkles size={11}/>}
                    {aiLoading ? "Writing…" : aiDone ? "Done" : "AI Write Bio"}
                  </button>
                </div>
                <textarea value={v("bio")} onChange={e => set("bio", e.target.value)}
                  placeholder="Write your bio here, or click 'AI Write Bio' to generate from your Brand Book."
                  rows={4} className={textareaBase}/>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="glass-card rounded-xl p-5" style={{ borderColor: `${COLOR}20` }}>
            <p className="text-xs font-black uppercase tracking-wider mb-4" style={{ color: COLOR }}>Platform Stats</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { key: "stat_streams", label: "Total Streams", placeholder: "e.g. 12M+" },
                { key: "stat_listeners", label: "Monthly Listeners", placeholder: "e.g. 850K" },
                { key: "stat_followers", label: "Total Followers", placeholder: "e.g. 2.1M" },
              ].map(f => (
                <div key={f.key}>
                  <label className={labelCls}>{f.label}</label>
                  <input type="text" value={v(f.key)} onChange={e => set(f.key, e.target.value)}
                    placeholder={f.placeholder} className={inputBase}/>
                </div>
              ))}
            </div>
          </div>

          {/* Highlights */}
          <div className="glass-card rounded-xl p-5" style={{ borderColor: `${COLOR}20` }}>
            <p className="text-xs font-black uppercase tracking-wider mb-4" style={{ color: COLOR }}>Key Highlights (up to 4)</p>
            <div className="space-y-3">
              {[1, 2, 3, 4].map(n => (
                <div key={n}>
                  <label className={labelCls}>Highlight {n}</label>
                  <input type="text" value={v(`highlight_${n}`)} onChange={e => set(`highlight_${n}`, e.target.value)}
                    placeholder={n === 1 ? "e.g. Featured on Apple Music Africa New Artists" : n === 2 ? "e.g. Performed at Afropunk Joburg 2025" : "e.g. Brand deal with Puma"}
                    className={inputBase}/>
                </div>
              ))}
            </div>
          </div>

          {/* Socials */}
          <div className="glass-card rounded-xl p-5" style={{ borderColor: `${COLOR}20` }}>
            <p className="text-xs font-black uppercase tracking-wider mb-4" style={{ color: COLOR }}>Social & Streaming Handles</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { key: "ig", label: "Instagram", placeholder: "@artistname" },
                { key: "tiktok", label: "TikTok", placeholder: "@artistname" },
                { key: "spotify", label: "Spotify", placeholder: "spotify.com/artist/..." },
                { key: "apple", label: "Apple Music", placeholder: "music.apple.com/..." },
                { key: "youtube", label: "YouTube", placeholder: "@artistname" },
              ].map(f => (
                <div key={f.key}>
                  <label className={labelCls}>{f.label}</label>
                  <input type="text" value={v(f.key)} onChange={e => set(f.key, e.target.value)}
                    placeholder={f.placeholder} className={inputBase}/>
                </div>
              ))}
            </div>
          </div>

          {/* Management */}
          <div className="glass-card rounded-xl p-5" style={{ borderColor: `${COLOR}20` }}>
            <p className="text-xs font-black uppercase tracking-wider mb-4" style={{ color: COLOR }}>Management Contact</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { key: "manager_name", label: "Manager / Company", placeholder: "Your name" },
                { key: "manager_email", label: "Email", placeholder: "manager@email.com" },
                { key: "manager_phone", label: "Phone / WhatsApp", placeholder: "+27 XX XXX XXXX" },
              ].map(f => (
                <div key={f.key}>
                  <label className={labelCls}>{f.label}</label>
                  <input type="text" value={v(f.key)} onChange={e => set(f.key, e.target.value)}
                    placeholder={f.placeholder} className={inputBase}/>
                </div>
              ))}
              <div>
                <label className={labelCls}>Label / Distributor (optional)</label>
                <input type="text" value={v("label")} onChange={e => set("label", e.target.value)}
                  placeholder="e.g. Independent / DistroKid" className={inputBase}/>
              </div>
            </div>
          </div>

          {/* Discography */}
          <div className="glass-card rounded-xl p-5" style={{ borderColor: `${COLOR}20` }}>
            <p className="text-xs font-black uppercase tracking-wider mb-4" style={{ color: COLOR }}>Discography (top 3 releases)</p>
            <div className="space-y-4">
              {[1, 2, 3].map(n => (
                <div key={n} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="sm:col-span-2">
                    <label className={labelCls}>Release {n} Title</label>
                    <input type="text" value={v(`release_${n}_title`)} onChange={e => set(`release_${n}_title`, e.target.value)}
                      placeholder="Title" className={inputBase}/>
                  </div>
                  <div>
                    <label className={labelCls}>Type</label>
                    <input type="text" value={v(`release_${n}_type`)} onChange={e => set(`release_${n}_type`, e.target.value)}
                      placeholder="Single / EP / Album" className={inputBase}/>
                  </div>
                  <div>
                    <label className={labelCls}>Year</label>
                    <input type="text" value={v(`release_${n}_year`)} onChange={e => set(`release_${n}_year`, e.target.value)}
                      placeholder="2025" className={inputBase}/>
                  </div>
                  <div className="sm:col-span-4">
                    <label className={labelCls}>Streams / Chart Achievement</label>
                    <input type="text" value={v(`release_${n}_streams`)} onChange={e => set(`release_${n}_streams`, e.target.value)}
                      placeholder="e.g. 4.2M streams · #3 SA Apple Music Charts" className={inputBase}/>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Live & Brands */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="glass-card rounded-xl p-5" style={{ borderColor: `${COLOR}20` }}>
              <p className="text-xs font-black uppercase tracking-wider mb-4" style={{ color: COLOR }}>Live Performances (up to 4)</p>
              <div className="space-y-3">
                {[1, 2, 3, 4].map(n => (
                  <div key={n}>
                    <label className={labelCls}>Show {n}</label>
                    <input type="text" value={v(`live_${n}`)} onChange={e => set(`live_${n}`, e.target.value)}
                      placeholder={n === 1 ? "e.g. Afropunk Joburg 2025" : "Event / venue / year"}
                      className={inputBase}/>
                  </div>
                ))}
              </div>
            </div>
            <div className="glass-card rounded-xl p-5" style={{ borderColor: `${COLOR}20` }}>
              <p className="text-xs font-black uppercase tracking-wider mb-4" style={{ color: COLOR }}>Brand Partnerships (up to 3)</p>
              <div className="space-y-3">
                {[1, 2, 3].map(n => (
                  <div key={n}>
                    <label className={labelCls}>Brand {n}</label>
                    <input type="text" value={v(`brand_${n}`)} onChange={e => set(`brand_${n}`, e.target.value)}
                      placeholder="e.g. Puma, Beats by Dre, Spotify" className={inputBase}/>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Press */}
          <div className="glass-card rounded-xl p-5" style={{ borderColor: `${COLOR}20` }}>
            <p className="text-xs font-black uppercase tracking-wider mb-4" style={{ color: COLOR }}>Press Quotes (up to 2)</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {[1, 2].map(n => (
                <div key={n} className="space-y-3">
                  <div>
                    <label className={labelCls}>Quote {n}</label>
                    <textarea value={v(`press_${n}`)} onChange={e => set(`press_${n}`, e.target.value)}
                      placeholder="The exact quote from the review or article..."
                      rows={2} className={textareaBase}/>
                  </div>
                  <div>
                    <label className={labelCls}>Source</label>
                    <input type="text" value={v(`press_${n}_source`)} onChange={e => set(`press_${n}_source`, e.target.value)}
                      placeholder="e.g. OkayAfrica, Trident Media" className={inputBase}/>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between flex-wrap gap-3 pb-4">
            <button onClick={handleReset}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-text-muted hover:text-text-primary border border-border hover:border-text-muted transition-all">
              <RotateCcw size={12}/>Clear all
            </button>
            <button onClick={() => setTab("preview")}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all hover:opacity-90"
              style={{ backgroundColor: `${COLOR}20`, color: COLOR, border: `1px solid ${COLOR}30` }}>
              Choose Template & Preview
              <ChevronRight size={14}/>
            </button>
          </div>
        </div>
      )}

      {/* ── PREVIEW TAB ── */}
      {tab === "preview" && (
        <div>
          {/* Template selector */}
          <div className="mb-6">
            <p className="text-xs font-black uppercase tracking-widest mb-3" style={{ color: COLOR }}>Choose Template</p>
            <div className="grid grid-cols-1 xs:grid-cols-3 sm:grid-cols-3 gap-4">
              {TEMPLATES.map(t => (
                <button
                  key={t.id}
                  onClick={() => setTemplate(t.id)}
                  className="text-left transition-all"
                >
                  <div className={`rounded-xl overflow-hidden border-2 transition-all ${template === t.id ? "" : "border-border hover:border-brand/30"}`}
                    style={template === t.id ? { borderColor: COLOR } : {}}>
                    <TemplatePreview id={t.id} bg={t.bg} accent={t.accent}/>
                  </div>
                  <div className="mt-2 px-1">
                    <p className={`text-xs font-bold transition-colors ${template === t.id ? "" : "text-text-muted"}`} style={template === t.id ? { color: COLOR } : {}}>
                      {t.label}
                    </p>
                    <p className="text-[10px] text-text-muted">{t.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <p className="text-sm text-text-muted">Scroll to review, then export to PDF.</p>
            <button onClick={handleExport}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all hover:opacity-90"
              style={{ backgroundColor: COLOR, color: "#fff" }}>
              🖨️ Export as PDF
            </button>
          </div>

          {/* Scaled preview */}
          <div className="overflow-x-auto pb-4">
            <div ref={previewRef} style={{ width: "794px" }}>
              {template === "dark-editorial" && <DarkEditorialTemplate d={data}/>}
              {template === "clean-minimal"  && <CleanMinimalTemplate d={data}/>}
              {template === "bold-graphic"   && <BoldGraphicTemplate d={data}/>}
            </div>
          </div>

          {/* Export tip */}
          <div className="mt-6 glass-card rounded-xl p-4 flex items-start gap-3" style={{ borderColor: "rgba(201,168,76,0.15)", backgroundColor: "rgba(201,168,76,0.04)" }}>
            <span className="text-base flex-shrink-0">💡</span>
            <p className="text-xs text-text-muted leading-relaxed">
              <span className="font-semibold text-brand">How to export:</span> Click &ldquo;Export as PDF&rdquo;. A print window opens. Choose <strong className="text-text-primary">Save as PDF</strong> as the destination. Use <strong className="text-text-primary">A4 paper size, no margins</strong>. Set scale to <strong className="text-text-primary">100%</strong> for pixel-perfect output.
            </p>
          </div>

          <div className="flex items-center justify-between mt-5 pb-4">
            <button onClick={() => setTab("form")}
              className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-text-primary transition-colors">
              <ChevronLeft size={15}/>Back to form
            </button>
            <button onClick={handleExport}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all hover:opacity-90"
              style={{ backgroundColor: COLOR, color: "#fff" }}>
              🖨️ Export as PDF
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
