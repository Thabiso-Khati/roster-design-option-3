// ============================================================
// ROSTER — Platform brand logos
// ------------------------------------------------------------
// Inline SVG logos for every platform ROSTER tracks. Kept
// separate from lib/scoring/platforms.ts because that file is
// pure data (server + client safe) — JSX components live here.
//
// Each logo:
//   • renders at the requested size (default 14px)
//   • uses currentColor for paths so a parent text-color tints it
//   • exposes its canonical brand color via PLATFORM_BRAND so the
//     active tab in the modal can colour-match
//
// Sources for path data:
//   spotify, youtube, instagram, tiktok, deezer  → simple-icons
//     (CC0). Single-path SVGs at 24x24 viewBox.
//   audiomack, boomplay, mdundo → custom monogram badges (the
//     official brand SVGs aren't in simple-icons; a clean rounded
//     square with the platform initial reads cleanly at tab size
//     and stays on-brand via colour).
// ============================================================

import type { Platform } from "@/lib/scoring/types";

export const PLATFORM_BRAND: Record<Platform, string> = {
  spotify: "#1DB954",
  youtube: "#FF0000",
  audiomack: "#FFA200",
  boomplay: "#E72C30",
  tiktok: "#000000", // canonical TikTok mark is monochrome black
  instagram: "#E1306C", // representative pink from the gradient
  mdundo: "#7F2D9F", // Mdundo purple
  deezer: "#A238FF", // 2023+ Deezer purple
};

interface LogoProps {
  size?: number;
  className?: string;
}

// ─── Real brand SVGs (from simple-icons / CC0) ────────────────

function SpotifyLogo({ size = 14, className = "" }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.42 1.56-.301.421-1.02.599-1.56.3z" />
    </svg>
  );
}

function YouTubeLogo({ size = 14, className = "" }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

function TikTokLogo({ size = 14, className = "" }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
    </svg>
  );
}

function InstagramLogo({ size = 14, className = "" }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
    </svg>
  );
}

function DeezerLogo({ size = 14, className = "" }: LogoProps) {
  // Deezer's classic equalizer-bars mark, simplified to 8 bars.
  // The real brand uses a horizontal-bar grid with multi-coloured
  // bars; the monochrome currentColor variant reads cleanly at 14px
  // and still parses as "Deezer" because of the iconic bar-grid.
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <rect x="0" y="3" width="5" height="3" rx="0.5" />
      <rect x="6.3" y="3" width="5" height="3" rx="0.5" />
      <rect x="12.7" y="3" width="5" height="3" rx="0.5" />
      <rect x="19" y="3" width="5" height="3" rx="0.5" />
      <rect x="6.3" y="9" width="5" height="3" rx="0.5" />
      <rect x="12.7" y="9" width="5" height="3" rx="0.5" />
      <rect x="19" y="9" width="5" height="3" rx="0.5" />
      <rect x="12.7" y="15" width="5" height="3" rx="0.5" />
      <rect x="19" y="15" width="5" height="3" rx="0.5" />
      <rect x="0" y="21" width="5" height="3" rx="0.5" />
      <rect x="6.3" y="21" width="5" height="3" rx="0.5" />
      <rect x="12.7" y="21" width="5" height="3" rx="0.5" />
      <rect x="19" y="21" width="5" height="3" rx="0.5" />
    </svg>
  );
}

// ─── Hand-crafted brand marks for platforms not in simple-icons ──
//
// Audiomack, Boomplay, Mdundo: SVG approximations of the real
// brand marks (black rounded-square + orange waveform, black
// circle + gradient B, orange circle + headphones character).
// Reads much closer to the actual app icons than a plain
// monogram. Replace each with a `<img>` of the official PNG by
// dropping `audiomack.png` / `boomplay.png` / `mdundo.png` into
// `public/logos/platforms/` and switching the body of these
// components to `<Image src="/logos/platforms/..." />`.

function AudiomackLogo({ size = 14, className = "" }: LogoProps) {
  // Black rounded square + orange jagged waveform — the canonical
  // Audiomack mark. The polyline is a 5-spike audio waveform
  // (small-tall-low-tall-medium) that reads as an EQ at 14px.
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      aria-hidden="true"
    >
      <rect width="24" height="24" rx="5" fill="#000" />
      <path
        d="M3 13 L5.5 11 L7 14 L9 4 L11 18 L13 7 L15 15 L17 10 L19 12 L21 13"
        stroke="#FFA200"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

function BoomplayLogo({ size = 14, className = "" }: LogoProps) {
  // Black filled circle + thin gradient ring + gradient "B"
  // letter inside. Approximates the blue→teal gradient of the
  // real Boomplay mark.
  const gid = "bp-grad";
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#1E88E5" />
          <stop offset="100%" stopColor="#3DD9B6" />
        </linearGradient>
      </defs>
      <circle cx="12" cy="12" r="11" fill="#000" />
      <circle
        cx="12"
        cy="12"
        r="10"
        fill="none"
        stroke={`url(#${gid})`}
        strokeWidth="1.2"
      />
      <text
        x="12"
        y="17"
        textAnchor="middle"
        fontSize="13"
        fontWeight="900"
        fontFamily="system-ui, -apple-system, sans-serif"
        fontStyle="italic"
        fill={`url(#${gid})`}
      >
        B
      </text>
    </svg>
  );
}

function MdundoLogo({ size = 14, className = "" }: LogoProps) {
  // Orange filled circle + black headphones glyph — captures the
  // Mdundo mark's signature orange-on-black headphones character
  // without needing the scalloped border (which doesn't read at
  // 14px anyway).
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="11" fill="#FFA200" />
      {/* headphones band + ear-cups */}
      <path
        d="M6 13 a6 6 0 0 1 12 0"
        stroke="#000"
        strokeWidth="1.6"
        fill="none"
        strokeLinecap="round"
      />
      <rect x="5" y="12.5" width="3" height="5" rx="1" fill="#000" />
      <rect x="16" y="12.5" width="3" height="5" rx="1" fill="#000" />
      {/* sunglasses bar + lenses */}
      <rect x="8" y="9" width="8" height="1.2" fill="#000" />
      <circle cx="9.5" cy="10.6" r="1.4" fill="#000" />
      <circle cx="14.5" cy="10.6" r="1.4" fill="#000" />
    </svg>
  );
}

// ─── Public API ───────────────────────────────────────────────

interface PlatformLogoProps {
  platform: Platform;
  size?: number;
  /**
   * If true, the logo renders in its brand colour (great for the
   * active tab). If false, it inherits text colour (great for
   * inactive tabs that should match `text-text-muted`).
   */
  branded?: boolean;
  className?: string;
}

export function PlatformLogo({
  platform,
  size = 14,
  branded = false,
  className = "",
}: PlatformLogoProps) {
  // When branded → wear the platform's brand colour at full
  // saturation. When not (i.e. the tab is inactive) → desaturate
  // and dim, so the row of 8 tabs reads as "one active, the rest
  // muted" instead of "five colourful logos competing for attention".
  // Works uniformly for currentColor SVGs (Spotify/YouTube/etc.)
  // and natively-coloured SVGs (Audiomack/Boomplay/Mdundo).
  const style: React.CSSProperties = branded
    ? { color: PLATFORM_BRAND[platform] }
    : { filter: "grayscale(1) opacity(0.55)" };
  const merged = `inline-block flex-shrink-0 ${className}`;

  const logo = (() => {
    switch (platform) {
      case "spotify":
        return <SpotifyLogo size={size} />;
      case "youtube":
        return <YouTubeLogo size={size} />;
      case "tiktok":
        return <TikTokLogo size={size} />;
      case "instagram":
        return <InstagramLogo size={size} />;
      case "deezer":
        return <DeezerLogo size={size} />;
      case "audiomack":
        return <AudiomackLogo size={size} />;
      case "boomplay":
        return <BoomplayLogo size={size} />;
      case "mdundo":
        return <MdundoLogo size={size} />;
      default:
        return null;
    }
  })();

  return (
    <span className={merged} style={style}>
      {logo}
    </span>
  );
}
