/* ═══════════════════════════════════════════
   PATRIMOINE — Service Worker
   Cache-first strategy for offline support
═══════════════════════════════════════════ */

const CACHE_NAME = 'patrimoine-v7';

const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/icon.svg',
  '/manifest.json',
  'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js',
  'https://fonts.googleapis.com/css2?family=DM+Mono:ital,wght@0,400;0,500&family=Inter:wght@400;500;600;700;800&display=swap'
];

/* ── Install : mise en cache des ressources ── */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS_TO_CACHE.filter(url => !url.startsWith('https://fonts')));
    })
  );
  self.skipWaiting();
});

/* ── Activate : nettoyage des vieux caches ── */
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

/* ── Fetch : cache-first, réseau en fallback ── */
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;

      return fetch(event.request)
        .then(response => {
          if (!response || response.status !== 200 || response.type === 'opaque') {
            return response;
          }
          const toCache = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, toCache));
          return response;
        })
        .catch(() => {
          /* Offline fallback pour les pages HTML */
          if (event.request.destination === 'document') {
            return caches.match('/index.html');
          }
        });
    })
  );
});
