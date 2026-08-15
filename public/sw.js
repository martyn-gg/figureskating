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

  e.respondWith(
    caches.match(req).then(hit => hit
      || network.then(res => res || caches.match(new URL('./', location).pathname))
      || Response.error())
  );
});
