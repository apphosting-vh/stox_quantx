const CACHE_NAME = 'stox-7.10.1-1f96c477f9e6';
const urlsToCache = [
  './',
  './index.html',
  './assets/vendor.js',
  './assets/xlsx.js',
  './assets/qx.js',
  './assets/qx.css',
  './assets/app.js',
  './manifest.json',
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
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
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
