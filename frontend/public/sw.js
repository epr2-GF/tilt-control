
const CACHE_NAME = 'tilt44-v1';

const ASSETS = [
  '/',
  '/manifest.webmanifest'
];

// Install and cache available assets without failing
// the entire installation if one asset is unavailable.
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      await Promise.all(
        ASSETS.map(async (url) => {
          try {
            await cache.add(url);
          } catch (error) {
            console.warn('Unable to cache:', url, error);
          }
        })
      );
    })
  );

  self.skipWaiting();
});

// Existing offline caching
self.addEventListener('fetch', (event) => {
  if (
    event.request.method !== 'GET' ||
    new URL(event.request.url).origin !== self.location.origin
  ) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});

// Web Push notifications
self.addEventListener('push', (event) => {
  let data = {};

  if (event.data) {
    try {
      data = event.data.json();
    } catch {
      data = {
        title: 'Tilt44',
        body: event.data.text(),
      };
    }
  }

  event.waitUntil(
    self.registration.showNotification(data.title || 'Tilt44', {
      body: data.body || '',
      icon: '/icon-192x192.png',
      badge: '/icon-192x192.png',
      data: {
        url: data.url || '/',
      },
      vibrate: [200, 100, 200],
      tag: 'tilt44-notification',
      renotify: true,
    })
  );
});

// Open Tilt44 when a notification is clicked
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = new URL(
    event.notification.data?.url || '/',
    self.location.origin
  ).href;

  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true,
    }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.startsWith(self.location.origin)) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }

      return clients.openWindow(targetUrl);
    })
  );
});
