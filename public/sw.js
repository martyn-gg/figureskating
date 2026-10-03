/* Offline support for a reference guide read in a cold rink with no signal.

   The first version of this was cache-first with a fixed cache name and no
   revalidation, which meant the first copy of a page a reader ever loaded was
   the copy they kept — permanently. That is fine for a week and indefensible for
   a guide whose whole premise is that coaches will correct it: a fix would never
   have reached anyone who had already visited.

   So: stale-while-revalidate. The cached copy goes back immediately, which is
   what makes it usable on rink wi-fi, and the fresh copy is fetched behind it and
   written for next time. The cache is named after the build, so a deploy retires
   the old one outright rather than layering on top of it. */

const VERSION = new URL(self.location.href).searchParams.get('v') || 'dev';
const CACHE = `figureguide-${VERSION}`;

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', e => e.waitUntil(
  caches.keys()
    .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim())
));

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;

  /* Started and registered synchronously — calling waitUntil after an await
     throws, and a background update that gets killed mid-flight is the bug this
     file already had once. */
  const network = fetch(req)
    .then(res => {
      if (res && res.ok && res.type === 'basic') {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
      }
      return res;
    })
    .catch(() => null);
  e.waitUntil(network);

  /* A PAGE COMES FROM THE NETWORK FIRST — 03/10/2026. Served stale, the first
     page after a deploy was the old build and the next one, fetched fresh, was the
     new: two versions of the guide's look alternating as a reader moved about,
     which is what Martyn saw. A page now waits for the network and falls back to
     the cache only when there is none, which is the rink with no signal this file
     exists for. Fonts, scripts and images still come from the cache first. */
  if (req.mode === 'navigate') {
    e.respondWith(network
      .then(res => res || caches.match(req))
      .then(res => res || caches.match(new URL('./', location).pathname))
      .then(res => res || Response.error()));
    return;
  }
  e.respondWith(
    caches.match(req).then(hit => hit
      || network.then(res => res || caches.match(new URL('./', location).pathname))
      || Response.error())
  );
});
