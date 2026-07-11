/*! © 2026 Aaria's Blue Elephant · offline cache for the games ONLY.
 * Registered by the game kit (never by the React site), so site deploys are
 * unaffected: we only handle GET requests under the game directories below.
 * Strategy: stale-while-revalidate — serve from cache instantly when offline
 * or slow, refresh the cache in the background when online.
 *
 * NEW GAMES: add the game's folder name to GAME_RX below.
 * (scripts/check-game-controls.mjs fails if a game folder is missing here.)
 */
const CACHE = "abe-games-v2";
const GAME_RX = /^\/(gamekit|grocery|dayplanner|blockcraft|elly-tubbies|roadsafety|doughlab|magnetblocks|helpinghands|craft3d|images\/games|legal|sounds)(\/|$)/;

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith("abe-games") && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== location.origin || !GAME_RX.test(url.pathname)) return;
  e.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const hit = await cache.match(e.request, { ignoreSearch: true });
      const refresh = fetch(e.request)
        .then((res) => { if (res && res.ok) cache.put(e.request, res.clone()); return res; })
        .catch(() => hit);
      return hit || refresh;
    })
  );
});
