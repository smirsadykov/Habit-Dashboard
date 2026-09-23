/* Bump CACHE when the app shell changes — that is what ships an update. */
const CACHE = "daydesk-v11";
const SHELL = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icon-192.png",
  "./icon-512.png",
  "./icon-180.png",
  "./icon-maskable-512.png",
];
/* Fonts live on Google's CDN; cache them on first use so the app looks the
   same offline. Everything else off-origin goes straight to the network. */
const FONT_HOSTS = ["fonts.googleapis.com", "fonts.gstatic.com"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;

  /* The page itself goes to the network first. Serving it from cache means a
     device that is online still shows yesterday's app until it happens to
     reload twice — the cache is the offline fallback here, not the source. */
  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put("./index.html", copy));
        return res;
      }).catch(() => caches.match("./index.html", { ignoreSearch: true }))
    );
    return;
  }

  /* Everything else is cache-first: icons, the manifest and the fonts only
     change when CACHE changes, and install has already refetched them. */
  const url = new URL(req.url);
  const cacheable = url.origin === location.origin || FONT_HOSTS.includes(url.hostname);
  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then(hit => hit || fetch(req).then(res => {
      if (cacheable && res.ok) {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy));
      }
      return res;
    }))
  );
});
