/* BUILD TEMPLATE: this file lives at src/sw.js. scripts/build.mjs replaces
 * CACHE_NAME and urlsToCache in the generated dist/sw.js with the current
 * hashed bundles (including qx.js/qx.css). See MIGRATION.md.
 * Do not hand-edit dist/sw.js. */
const CACHE_NAME = 'stox-9.1.0-6d5894358dee';
const urlsToCache = [
  './',
  './index.html',
  './assets/vendor.js',
  './assets/xlsx.js',
  './assets/qx.js',
  './assets/qx.css',
  './assets/ui.css',
  './assets/app.js',
  './manifest.json',
  './icons/stox-icon.svg',
  './icons/favicon-16x16.png',
  './icons/favicon-32x32.png',
  './icons/favicon-48x48.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './rows.json'
];

self.addEventListener('install', event => {
  /* If precaching fails (offline / CDN hiccup) still activate â€”
     network-first fetch ensures fresh code arrives on the next load anyway. */
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      /* Only retire this app's own caches. Deleting every origin cache wipes
         unrelated apps/data that happen to share the same host. */
      Promise.all(keys.filter(k => k !== CACHE_NAME && k.indexOf('stox-') === 0).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  var url = new URL(event.request.url);
  var sameOrigin = url.origin === self.location.origin;

  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).then(r => {
        if (r && r.status === 200) {
          var clone = r.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          return r;
        }
        return caches.match(event.request).then(cached => cached || r);
      }).catch(() => caches.match(event.request))
    );
  } else if (sameOrigin) {
    /* App scripts/data: network-first so code updates actually arrive.
       Falls back to the cached copy when offline. */
    event.respondWith(
      fetch(event.request).then(r => {
        if (r && r.status === 200) {
          var clone = r.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          return r;
        }
        return caches.match(event.request).then(cached => cached || r);
      }).catch(() => caches.match(event.request))
    );
  } else {
    /* CDN assets: cache-first. */
    event.respondWith(
      caches.match(event.request).then(response => {
        if (response) return response;
        return fetch(event.request).catch(() => new Response('', { status: 503, statusText: 'Offline' }));
      })
    );
  }
});

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
