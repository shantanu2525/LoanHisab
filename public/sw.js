/* ─── LoanHisab Service Worker ───────────────────────────────────────────────
   Caching strategy:
   • Same-origin statics (shell, icons, manifest) → cache-first
   • Google Fonts (CDN, cacheable)                  → stale-while-revalidate
   • Navigations                                    → network-first, shell fallback
   • Nothing besides these is cached — user inputs never leave the device anyway
   --------------------------------------------------------------------------- */

const VERSION = "loanhisab-v1.1.0";
const SHELL_CACHE = `${VERSION}-shell`;
const FONT_CACHE = `${VERSION}-fonts`;

const baseOf = (p) => p.replace(/\/(sw\.js)?$/, "/");
const BASE = baseOf(self.location.pathname);

const OFFLINE_URL = `${BASE}offline.html`;
const SHELL_ASSETS = [
  BASE,
  `${BASE}index.html`,
  `${BASE}manifest.webmanifest`,
  OFFLINE_URL,
  `${BASE}favicon.png`,
  `${BASE}icons/icon-192.png`,
  `${BASE}icons/icon-512.png`,
  `${BASE}icons/icon-180.png`,
  `${BASE}icons/icon-maskable-192.png`,
  `${BASE}icons/icon-maskable-512.png`,
  `${BASE}icons/favicon-32.png`,
];

// — install: pre-cache the shell, take control as soon as the app asks —
self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(SHELL_CACHE);
      // Add individually so one missing asset never breaks installation.
      await Promise.allSettled(SHELL_ASSETS.map((url) => cache.add(url)));
      // Do NOT auto-skipWaiting — the page posts SKIP_WAITING after user consent.
    })()
  );
});

// — activate: drop every older cache, claim clients —
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keep = new Set([SHELL_CACHE, FONT_CACHE]);
      const names = await caches.keys();
      await Promise.all(names.filter((n) => !keep.has(n)).map((n) => caches.delete(n)));
      await self.clients.claim();
    })()
  );
});

self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});

// Helper responding with the cached shell (SPA fallback)
async function fromShell() {
  return (await caches.match(BASE)) || (await caches.match(`${BASE}index.html`));
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // — font CDNs: stale-while-revalidate —
  if (url.origin === "https://fonts.googleapis.com" || url.origin === "https://fonts.gstatic.com") {
    event.respondWith(
      (async () => {
        const cache = await caches.open(FONT_CACHE);
        const cached = await cache.match(request);
        const network = fetch(request)
          .then((res) => {
            if (res && res.status === 200) cache.put(request, res.clone());
            return res;
          })
          .catch(() => undefined);
        return cached || (await network) || cached || Response.error();
      })()
    );
    return;
  }

  // — only handle same-origin beyond this point —
  if (url.origin !== self.location.origin) return;

  // — navigations: network-first → shell → offline page —
  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const res = await fetch(request);
          if (res && res.status === 200 && res.type === "basic") {
            const cache = await caches.open(SHELL_CACHE);
            cache.put(BASE, res.clone());
          }
          return res;
        } catch {
          const shell = await fromShell();
          if (shell) return shell;
          const offline = await caches.match(OFFLINE_URL);
          return (
            offline ||
            new Response("Offline", { status: 503, statusText: "Offline" })
          );
        }
      })()
    );
    return;
  }

  // — same-origin statics: cache-first, then fill cache from network —
  event.respondWith(
    (async () => {
      const cached = await caches.match(request, { ignoreSearch: true });
      if (cached) return cached;
      try {
        const res = await fetch(request);
        if (res && res.status === 200 && res.type === "basic") {
          const cache = await caches.open(SHELL_CACHE);
          cache.put(request, res.clone());
        }
        return res;
      } catch {
        // Non-navigation assets: fail softly (never break the app on SW errors)
        return Response.error();
      }
    })()
  );
});
