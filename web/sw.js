const CACHE = "onjeom-original-integrated-v1";
const CORE = [
  "/",
  "/index.html",
  "/styles.css",
  "/patch.css",
  "/src/app.mjs",
  "/src/logic.mjs",
  "/src/mobile-domain.mjs",
  "/src/legacy-mobile.mjs",
  "/src/seasonal.mjs",
  "/src/season-calendar.mjs",
  "/assets/icon.svg",
  "/manifest.webmanifest",
  "/transfer/",
  "/transfer.mjs",
];
self.addEventListener("install", (e) =>
  e.waitUntil(
    caches
      .open(CACHE)
      .then((c) => c.addAll(CORE))
      .then(() => self.skipWaiting()),
  ),
);
self.addEventListener("activate", (e) =>
  e.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k.startsWith("onjeom-") && k !== CACHE)
            .map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  ),
);
self.addEventListener("fetch", (e) => {
  if (
    e.request.method !== "GET" ||
    new URL(e.request.url).origin !== self.location.origin
  )
    return;
  e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
});
