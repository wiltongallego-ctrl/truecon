const CACHE_NAME = 'truecon-pwa-v0.1.5';
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json'
];

// Instalar o service worker
self.addEventListener('install', (event) => {
  console.log('Service Worker: Instalando versão', CACHE_NAME);
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Cache aberto');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        // Força a ativação imediata do novo service worker
        return self.skipWaiting();
      })
  );
});

// Ativar o service worker
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Ativando versão', CACHE_NAME);
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Deletar caches antigos
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Deletando cache antigo', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Força o controle imediato de todas as abas
      return self.clients.claim();
    })
  );
});

// Interceptar requisições
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Retorna o cache se encontrado, senão busca na rede
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});

// Listener para push notifications
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push notification recebida');
  
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body || 'Nova notificação disponível!',
      icon: data.icon || '/favicon.ico',
      badge: data.badge || '/favicon.ico',
      vibrate: data.vibrate || [200, 100, 200],
      data: data.data || {},
      actions: data.actions || []
    };

    event.waitUntil(
      self.registration.showNotification(data.title || 'TrueCon', options)
    );
  }
});

// Listener para cliques em notificações
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Clique em notificação');
  
  event.notification.close();

  if (event.action === 'open-phase') {
    // Abrir a fase específica
    const phaseNumber = event.notification.data?.phaseNumber;
    const url = phaseNumber ? `/phase/${phaseNumber}` : '/';
    
    event.waitUntil(
      clients.openWindow(url)
    );
  } else if (event.action !== 'close') {
    // Ação padrão: abrir a aplicação
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Listener para background sync
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync');
  
  if (event.tag === 'phase-notification') {
    event.waitUntil(
      // Aqui você pode implementar lógica para sincronizar notificações offline
      console.log('Sincronizando notificações de fase...')
    );
  }
});

// Listener para mensagens do cliente (para forçar atualizações)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('Service Worker: Forçando atualização');
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
});