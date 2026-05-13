// Sentry wrapping is skipped in local dev for two reasons:
//  1. withSentryConfig injects webpack plugins that are incompatible with
//     Turbopack (Next.js 16 default), causing the dev server to hang silently.
//  2. Source-map uploads and release tracking are only meaningful in CI/prod.
// In production (Vercel), NODE_ENV=production so Sentry wraps correctly.
const isDev = process.env.NODE_ENV === "development";
const withSentryConfig = isDev
  ? (config) => config
  : require("@sentry/nextjs").withSentryConfig;

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Store build output in /tmp locally to avoid iCloud Drive file-locking conflicts.
  // iCloud syncs the Desktop folder in real-time; Turbopack's LevelDB cache
  // cannot tolerate concurrent file locks, so this keeps it out of the sync zone.
  // On Vercel (production), use the default ".next" so Vercel can find the output.
  distDir: (process.env.VERCEL || process.env.CI) ? ".next" : "/tmp/roster-v3-next-dev",

  // Allow the browser at 127.0.0.1 to load dev bundles from the Next.js
  // server running on localhost. Required in dev because Spotify's OAuth
  // policy no longer accepts http://localhost as a redirect URI, so we
  // serve ROSTER at http://127.0.0.1:3001 during development.
  allowedDevOrigins: ["127.0.0.1", "localhost"],

  // Enable PWA headers
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache" },
          { key: "Content-Type", value: "application/javascript" },
        ],
      },
    ];
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "https", hostname: "i.scdn.co" },        // Spotify artist images
      { protocol: "https", hostname: "mosaic.scdn.co" },   // Spotify mosaic images
      { protocol: "https", hostname: "image-cdn-*.spotifycdn.com" },
    ],
  },
};

module.exports = withSentryConfig(nextConfig, {
  // Sentry organisation + project (set in .env.local or Vercel env):
  //   SENTRY_ORG=your-org
  //   SENTRY_PROJECT=roster-v3
  //   SENTRY_AUTH_TOKEN=sntrys_...
  silent: !process.env.CI,             // suppress Sentry CLI output locally
  widenClientFileUpload: true,         // upload larger source maps
  hideSourceMaps: true,                // don't expose maps to the browser
});
