/**
 * Sanitize contract HTML for print rendering.
 *
 * The HTML captured at send-time is a snapshot of the live contract page,
 * which includes:
 *   • Module-themed colors (gold, pink, etc.) hardcoded as inline styles
 *   • Form inputs with native browser chrome (date pickers, number spinners)
 *   • UI helper text ("Click each clause to read…")
 *   • Tailwind utility classes that don't print well
 *
 * This module strips/transforms those into a clean legal-document-ready
 * HTML string. Used by /sign/[token]/print.
 *
 * NOTE for future content rewrite: when contracts are replaced with real
 * legal text (no form fields, no UI helpers), this sanitizer becomes a
 * no-op for those contracts — it only modifies what it recognises and
 * passes everything else through unchanged.
 */

const NEUTRAL_COLOR_DARK = "#0F172A";
const NEUTRAL_COLOR_MUTED = "#475569";

/** Hex / rgb color patterns that should be neutralised in print. */
const COLOR_REPLACEMENTS: Array<[RegExp, string]> = [
  // Module theme colors (the gold / pink / etc. that show up as gold labels)
  [/color:\s*#C9A84C/gi, `color: ${NEUTRAL_COLOR_MUTED}`],         // Onboarding gold
  [/color:\s*#EC4899/gi, `color: ${NEUTRAL_COLOR_MUTED}`],          // Finance pink
  [/color:\s*#10B981/gi, `color: ${NEUTRAL_COLOR_MUTED}`],          // Recording green
  [/color:\s*#F59E0B/gi, `color: ${NEUTRAL_COLOR_MUTED}`],          // Touring amber
  [/color:\s*#8B5CF6/gi, `color: ${NEUTRAL_COLOR_MUTED}`],          // Marketing purple
  [/color:\s*#A855F7/gi, `color: ${NEUTRAL_COLOR_MUTED}`],          // Visual purple
  [/color:\s*#06B6D4/gi, `color: ${NEUTRAL_COLOR_MUTED}`],          // Publishing cyan
  [/color:\s*#22D3EE/gi, `color: ${NEUTRAL_COLOR_MUTED}`],          // Sync cyan
  [/color:\s*#0EA5E9/gi, `color: ${NEUTRAL_COLOR_MUTED}`],          // Distribution blue
  [/color:\s*#F472B6/gi, `color: ${NEUTRAL_COLOR_MUTED}`],          // PR pink
  [/color:\s*#EAB308/gi, `color: ${NEUTRAL_COLOR_MUTED}`],          // Royalties yellow
  [/color:\s*#FB923C/gi, `color: ${NEUTRAL_COLOR_MUTED}`],          // Merch orange
  [/color:\s*#EF4444/gi, `color: ${NEUTRAL_COLOR_MUTED}`],          // Fan red
  [/color:\s*#64748B/gi, `color: ${NEUTRAL_COLOR_MUTED}`],          // Legal slate
  [/color:\s*#475569/gi, `color: ${NEUTRAL_COLOR_MUTED}`],          // Vault slate

  // Background colors with module theming → strip
  [/background-color:\s*[^;]+15(?=[;\s"'])/gi, "background-color: transparent"],
  [/background-color:\s*[^;]+25(?=[;\s"'])/gi, "background-color: transparent"],
  [/background-color:\s*[^;]+20(?=[;\s"'])/gi, "background-color: transparent"],
  [/background-color:\s*rgba\([^)]+\)/gi, "background-color: transparent"],

  // Border colors with module theming → light grey
  [/border-color:\s*[^;]+25(?=[;\s"'])/gi, "border-color: #cbd5e1"],
  [/border-color:\s*[^;]+30(?=[;\s"'])/gi, "border-color: #cbd5e1"],
  [/border-color:\s*[^;]+40(?=[;\s"'])/gi, "border-color: #cbd5e1"],
  [/border-color:\s*rgba\([^)]+\)/gi, "border-color: #cbd5e1"],
];

/** Phrases that are UI helper text and should be stripped. */
const HELPER_PHRASES: RegExp[] = [
  /Click each clause[^<]*?(?=<|$)/gi,
  /Save your progress[^<]*?(?=<|$)/gi,
  /Auto[- ]?saved to this device[^<]*?(?=<|$)/gi,
  /Your form is saved[^<]*?(?=<|$)/gi,
  /Your agreement details are saved[^<]*?(?=<|$)/gi,
  /Use Save as PDF[^<]*?(?=<|$)/gi,
];

/** Tailwind / utility class names that should be neutralised. */
const CLASS_NEUTRALISERS: Array<[RegExp, string]> = [
  // Glass-card style → plain block
  [/class="([^"]*\bglass-card\b[^"]*)"/gi, 'class=""'],
];

/**
 * Sanitize a contract HTML snapshot for legal-print rendering.
 * Pure-string transforms — no DOM parsing required.
 */
export function sanitizeContractHtml(raw: string): string {
  let html = raw;

  // 1. Neutralise theme colors
  for (const [pattern, replacement] of COLOR_REPLACEMENTS) {
    html = html.replace(pattern, replacement);
  }

  // 2. Strip UI helper / instruction phrases
  for (const phrase of HELPER_PHRASES) {
    html = html.replace(phrase, "");
  }

  // 3. Strip Tailwind hover/focus utility classes that mean nothing in print
  html = html.replace(/\b(hover|focus|active|group-hover|focus-within|focus-visible):[a-zA-Z0-9-/[\]]+/g, "");

  // 4. Strip print-only-hide markers (the ones from on-screen) — actually keep them, the print CSS handles those

  // 5. Convert <input> elements to spans with their value as text content,
  //    so the printed PDF shows the user's filled-in data without any
  //    browser-native input chrome.
  html = html.replace(
    /<input([^>]*?)\s+value="([^"]*?)"([^>]*?)\/?>/gi,
    (_m, _pre, value, _post) => {
      if (!value) return ""; // empty input → nothing
      return `<span class="esign-static-value">${escapeHtml(value)}</span>`;
    },
  );
  // Inputs without a value attribute (which is most form inputs in React —
  // values live in state, not the rendered HTML attribute). Drop them entirely
  // because they have no captured value at snapshot time.
  html = html.replace(/<input\b[^>]*\/?>/gi, "");

  // 6. <textarea> with content → static block; empty → drop
  html = html.replace(
    /<textarea([^>]*?)>([\s\S]*?)<\/textarea>/gi,
    (_m, _attrs, body) => {
      const text = body.trim();
      if (!text) return "";
      return `<div class="esign-static-block">${escapeHtml(text)}</div>`;
    },
  );

  // 7. Strip <select> entirely — they have no value at snapshot
  html = html.replace(/<select\b[\s\S]*?<\/select>/gi, "");

  // 8. Strip <button> elements (UI-only)
  html = html.replace(/<button\b[\s\S]*?<\/button>/gi, "");

  // 9. Strip <svg> icons — they're decorative on the print page
  html = html.replace(/<svg\b[\s\S]*?<\/svg>/gi, "");

  // 10. Tailwind class neutralisers
  for (const [pattern, replacement] of CLASS_NEUTRALISERS) {
    html = html.replace(pattern, replacement);
  }

  return html;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
