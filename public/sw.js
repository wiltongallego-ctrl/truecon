// Service Worker for PWA
const CACHE_NAME = 'truecon-v1';
const urlsToCache = [
  '/',
  '/index.html'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => response || fetch(event.request))
  );
});

// Push notification event listener
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push Received.', event);

  let notificationData = {};
  
  if (event.data) {
    try {
      notificationData = event.data.json();
    } catch (e) {
      notificationData = {
        title: 'TrueCon',
        body: event.data.text() || 'Nova notificação disponível!',
        icon: '/favicon.ico',
        badge: '/favicon.ico'
      };
    }
  } else {
    notificationData = {
      title: 'TrueCon',
      body: 'Nova notificação disponível!',
      icon: '/favicon.ico',
      badge: '/favicon.ico'
    };
  }

  const options = {
    body: notificationData.body,
    icon: notificationData.icon || '/favicon.ico',
    badge: notificationData.badge || '/favicon.ico',
    vibrate: [100, 50, 100],
    data: notificationData.data || {},
    actions: [
      {
        action: 'open',
        title: 'Abrir App',
        icon: '/favicon.ico'
      },
      {
        action: 'close',
        title: 'Fechar'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(notificationData.title, options)
  );
});

// Notification click event listener
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification click Received.', event);

  event.notification.close();

  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Background sync for offline notifications
self.addEventListener('sync', (event) => {
  if (event.tag === 'phase-notification') {
    event.waitUntil(
      // Aqui podemos implementar lógica para sincronizar notificações offline
      console.log('[Service Worker] Background sync for phase notifications')
    );
  }
});