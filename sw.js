// Service Worker minimal — pas de cache pour index.html (évite les problèmes de version)
const CACHE_NAME = 'patrimoine-v9-4-' + Date.now();

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) => Promise.all(names.map((n) => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Ne pas intercepter — toujours réseau (pas de cache)
  return;
});
