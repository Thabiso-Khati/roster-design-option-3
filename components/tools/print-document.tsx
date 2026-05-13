"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export interface PrintStat  { label: string; value: string; }
export interface PrintTable { title?: string; headers: string[]; rows: (string | number)[][]; colWidths?: string[]; }
export interface PrintList  { title?: string; items: string[]; }
export interface PrintSection {
  heading: string;
  color?: string;
  stats?:  PrintStat[];
  tables?: PrintTable[];
  lists?:  PrintList[];
  note?:   string;
}

interface PrintDocumentProps {
  toolName:    string;
  subtitle?:   string;
  sections:    PrintSection[];
  onClose:     () => void;
  autoPrint?:  boolean;
}

export function PrintDocument({ toolName, subtitle, sections, onClose, autoPrint = true }: PrintDocumentProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    document.body.classList.add("print-mode");
    if (autoPrint) {
      const t = setTimeout(() => { window.print(); }, 400);
      const handler = () => { document.body.classList.remove("print-mode"); onClose(); };
      window.addEventListener("afterprint", handler);
      return () => { clearTimeout(t); window.removeEventListener("afterprint", handler); document.body.classList.remove("print-mode"); };
    }
    return () => { document.body.classList.remove("print-mode"); };
  }, [autoPrint, onClose]);

  const today = new Date().toLocaleDateString("en-ZA", { day:"numeric", month:"long", year:"numeric" });

  if (!mounted) return null;

  return createPortal(
    <div id="roster-print-doc" className="fixed inset-0 z-[9999] overflow-auto" style={{ background:"#fff", color:"#111", fontFamily:"'Inter', Arial, sans-serif" }}>

      {/* Close button — hidden on print */}
      <button onClick={() => { document.body.classList.remove("print-mode"); onClose(); }}
        id="print-close-btn"
        style={{ position:"fixed", top:16, right:16, zIndex:10000, padding:"8px 16px", borderRadius:8, border:"1px solid #ddd", background:"#f5f5f5", cursor:"pointer", fontSize:13, fontWeight:600 }}>
        ✕ Close
      </button>

      <div style={{ maxWidth:760, margin:"0 auto", padding:"40px 48px 60px" }}>

        {/* Header */}
        <div style={{ borderBottom:"3px solid #C9A84C", paddingBottom:16, marginBottom:28 }}>
          <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between" }}>
            <div>
              <div style={{ fontSize:11, fontWeight:800, letterSpacing:"0.12em", color:"#C9A84C", textTransform:"uppercase", marginBottom:4 }}>
                ROSTER by JO:LA LABS
              </div>
              <div style={{ fontSize:26, fontWeight:900, color:"#111", letterSpacing:"-0.5px", lineHeight:1.2 }}>
                {toolName}
              </div>
              {subtitle && <div style={{ fontSize:12, color:"#666", marginTop:4 }}>{subtitle}</div>}
            </div>
            <div style={{ textAlign:"right", fontSize:11, color:"#888" }}>
              <div style={{ fontWeight:700, color:"#111", marginBottom:2 }}>Exported</div>
              <div>{today}</div>
            </div>
          </div>
        </div>

        {/* Sections */}
        {sections.map((sec, si) => (
          <div key={si} style={{ marginBottom:32 }}>

            {/* Section heading */}
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14 }}>
              <div style={{ width:4, height:18, borderRadius:2, background: sec.color ?? "#C9A84C", flexShrink:0 }}/>
              <div style={{ fontSize:13, fontWeight:800, textTransform:"uppercase", letterSpacing:"0.08em", color: sec.color ?? "#C9A84C" }}>
                {sec.heading}
              </div>
            </div>

            {/* Stats row */}
            {sec.stats && sec.stats.length > 0 && (
              <div style={{ display:"grid", gridTemplateColumns:`repeat(${Math.min(sec.stats.length, 4)}, 1fr)`, gap:12, marginBottom:16 }}>
                {sec.stats.map((s, i) => (
                  <div key={i} style={{ border:"1px solid #e5e5e5", borderRadius:8, padding:"12px 14px", background:"#fafafa" }}>
                    <div style={{ fontSize:18, fontWeight:900, color:"#111" }}>{s.value}</div>
                    <div style={{ fontSize:10, color:"#888", marginTop:2, textTransform:"uppercase", letterSpacing:"0.06em" }}>{s.label}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Tables */}
            {sec.tables && sec.tables.map((tbl, ti) => (
              <div key={ti} style={{ marginBottom:16 }}>
                {tbl.title && <div style={{ fontSize:12, fontWeight:700, color:"#333", marginBottom:6 }}>{tbl.title}</div>}
                <table style={{ width:"100%", borderCollapse:"collapse", fontSize:11 }}>
                  <thead>
                    <tr style={{ background:"#f0f0f0" }}>
                      {tbl.headers.map((h, hi) => (
                        <th key={hi} style={{ padding:"7px 10px", textAlign:"left", fontWeight:700, color:"#444", fontSize:10, textTransform:"uppercase", letterSpacing:"0.06em", border:"1px solid #ddd", width: tbl.colWidths?.[hi] }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {tbl.rows.map((row, ri) => (
                      <tr key={ri} style={{ background: ri % 2 === 0 ? "#fff" : "#fafafa" }}>
                        {row.map((cell, ci) => (
                          <td key={ci} style={{ padding:"6px 10px", border:"1px solid #e8e8e8", color:"#222", verticalAlign:"top", lineHeight:1.4 }}>
                            {cell || "—"}
                          </td>
                        ))}
                      </tr>
                    ))}
                    {tbl.rows.length === 0 && (
                      <tr><td colSpan={tbl.headers.length} style={{ padding:"12px 10px", color:"#aaa", textAlign:"center", border:"1px solid #e8e8e8", fontStyle:"italic" }}>No data entered</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            ))}

            {/* Lists */}
            {sec.lists && sec.lists.map((lst, li) => (
              <div key={li} style={{ marginBottom:12 }}>
                {lst.title && <div style={{ fontSize:11, fontWeight:700, color:"#333", marginBottom:6 }}>{lst.title}</div>}
                <div style={{ border:"1px solid #e5e5e5", borderRadius:6, overflow:"hidden" }}>
                  {lst.items.map((item, ii) => (
                    <div key={ii} style={{ padding:"7px 12px", fontSize:11, color:"#333", borderBottom: ii < lst.items.length-1 ? "1px solid #eee" : "none", background: ii%2===0?"#fff":"#fafafa", display:"flex", gap:8, alignItems:"flex-start" }}>
                      <span style={{ color:"#C9A84C", fontWeight:700, flexShrink:0, marginTop:1 }}>›</span>
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {sec.note && (
              <div style={{ fontSize:10, color:"#888", fontStyle:"italic", marginTop:6, paddingLeft:12, borderLeft:"2px solid #e5e5e5" }}>
                {sec.note}
              </div>
            )}
          </div>
        ))}

        {/* Footer */}
        <div style={{ borderTop:"1px solid #e5e5e5", paddingTop:14, marginTop:8, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div style={{ fontSize:10, color:"#aaa" }}>© {new Date().getFullYear()} ROSTER by JO:LA LABS · Build a Superstar Roster.</div>
          <div style={{ fontSize:10, color:"#aaa" }}>roster.jola.co · Confidential</div>
        </div>
      </div>
    </div>,
    document.body
  );
}
