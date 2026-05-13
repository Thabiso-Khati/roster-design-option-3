// ROSTER Service Worker — PWA support
// v2: fixed to not intercept Next.js RSC navigation requests,
// and removed the dangerous caches.match("/") fallback that was
// returning the marketing landing page instead of the correct route.
const CACHE_NAME = "roster-v3";

// Only precache the manifest — never precache app routes.
// Authenticated HTML pages must always be fetched fresh so the server
// (and Supabase middleware) can validate the session on every request.
const PRECACHE_URLS = ["/manifest.json"];

// Install: precache static shell assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

// Activate: clean up stale caches from previous versions
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Fetch: cache only compiled Next.js static assets (_next/static/).
// Everything else — page navigations, RSC payloads, API calls — goes
// straight to the network so auth state is always evaluated server-side.
self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Only handle GET requests
  if (request.method !== "GET") return;

  // Never intercept API calls
  if (request.url.includes("/api/")) return;

  // Never intercept Next.js RSC / prefetch navigation requests.
  // These carry special headers (RSC, Next-Router-State-Tree, etc.) and
  // must reach the Next.js server unmodified so the router can handle
  // redirects (e.g. auth middleware) properly. If the service worker
  // follows a 302 itself and returns the final HTML to the RSC client,
  // Next.js gets confused and can navigate to an unexpected route.
  if (
    request.headers.get("RSC") ||
    request.headers.get("Next-Router-State-Tree") ||
    request.headers.get("Next-Router-Prefetch") ||
    request.headers.get("Next-Url")
  ) {
    return; // let the browser handle it natively
  }

  const url = new URL(request.url);

  // Cache-first for compiled JS/CSS bundles — these are content-hashed
  // so stale entries are never a problem.
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok) {
            const cloned = response.clone();
            caches.open(CACHE_NAME).then((cache) =>
              cache.put(request, cloned)
            );
          }
          return response;
        });
      })
    );
    return;
  }

  // For all other requests (page navigations, images, fonts, etc.) use
  // network-only with no cache fallback. This ensures the server's auth
  // middleware always runs and the user never sees a stale cached page.
  // (No event.respondWith call = browser fetches from network directly.)
});
