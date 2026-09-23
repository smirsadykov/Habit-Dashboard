/* Day Desk moved into Гиря (smirsadykov.github.io/KB-daily/). An installed copy
   checks this file for updates; this version removes the old app's offline copy
   and its own registration, then sends any open window to Гиря. It never touches
   another app's caches on the same site, and never touches localStorage — the
   data is exactly what Гиря's «День» tab reads. */
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k.startsWith("daydesk-")) await caches.delete(k);
    await self.registration.unregister();
    for (const c of await self.clients.matchAll({ type: "window" })) c.navigate("https://smirsadykov.github.io/KB-daily/");
  })());
});
