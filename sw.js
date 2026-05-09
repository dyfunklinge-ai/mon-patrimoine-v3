// Service Worker minimal pour Patrimoine PWA
// Sa seule présence permet à Chrome Android de proposer "Installer l'application"

const CACHE_NAME = 'patrimoine-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Stratégie network-first avec fallback cache
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Mettre en cache les réponses réussies
        if (response && response.status === 200 && response.type === 'basic') {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
