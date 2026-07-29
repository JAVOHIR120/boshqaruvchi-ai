const CACHE_NAME = 'boshliq-ai-v1';

self.addEventListener('install', function(event) {
  self.skipWaiting();
});

self.addEventListener('activate', function(event) {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request).then((response) => {
        return response || new Response("Network error occurred", {
          status: 408,
          statusText: "Network error occurred",
        });
      });
    })
  );
});
