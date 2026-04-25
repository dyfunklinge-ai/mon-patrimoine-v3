/* ═══════════════════════════════════════════════════════
   Patrimoine — Service Worker
   Stratégie : Network-First avec fallback cache
   - Toujours charger la dernière version si en ligne
   - Permet l'usage hors-ligne (fallback cache)
   - Pas de bug "vieille version qui reste"
   ═══════════════════════════════════════════════════════ */

const CACHE_VERSION = 'patrimoine-v1';
const CACHE_FILES = [
  './',
  './index.html',
  './manifest.json',
  './icon.svg'
];

// Installation : pré-cache les fichiers essentiels
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then((cache) => cache.addAll(CACHE_FILES))
      .then(() => self.skipWaiting())
  );
});

// Activation : nettoyer les anciens caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE_VERSION)
          .map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch : Network-First → cache en fallback
self.addEventListener('fetch', (event) => {
  // Ignorer les requêtes non-GET (POST, etc.) et les schémas non-http
  if (event.request.method !== 'GET') return;
  if (!event.request.url.startsWith('http')) return;

  // Ignorer les API externes (Binance, Yahoo Finance, proxies CORS)
  // pour qu'elles soient toujours fraîches et pas mises en cache
  const url = new URL(event.request.url);
  const externalAPIs = [
    'binance.com',
    'yahoo.com',
    'yahoofinance',
    'allorigins.win',
    'corsproxy',
    'thingproxy',
    'codetabs.com'
  ];
  if (externalAPIs.some((api) => url.hostname.includes(api))) {
    return; // Laisse passer sans toucher au cache
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Si OK, mettre en cache une copie pour usage hors-ligne
        if (response && response.status === 200 && response.type === 'basic') {
          const responseClone = response.clone();
          caches.open(CACHE_VERSION).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Pas de réseau : fallback sur le cache
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;
          // Si pas en cache et pas de réseau pour une page HTML : retourner index.html
          if (event.request.mode === 'navigate') {
            return caches.match('./index.html');
          }
          return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
        });
      })
  );
});

// Permettre la mise à jour forcée depuis le client (utile pour bouton "Forcer mise à jour")
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.keys().then((keys) => keys.forEach((k) => caches.delete(k)));
  }
});
