
const CACHE_NAME = 'tilt44-v4';

const ASSETS = [
  '/manifest.webmanifest'
];

// Install
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

// Activate and remove obsolete caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(async (keys) => {
      await Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      );

      await self.clients.claim();
    })
  );
});

// Fetch
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  if (
    event.request.method !== 'GET' ||
    url.origin !== self.location.origin
  ) {
    return;
  }

  // Always use the network for pages, API requests and Next.js assets.
  if (
    event.request.mode === 'navigate' ||
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/_next/') ||
    event.request.headers.get('accept')?.includes('text/event-stream')
  ) {
    return;
  }

  // Only use the current cache for other assets.
  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cached = await cache.match(event.request);
      return cached || fetch(event.request);
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
      badge: '/notification-badge.png',
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
