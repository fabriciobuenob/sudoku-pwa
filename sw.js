// Nome do cache — mude a versão (v1 -> v2) sempre que atualizar os arquivos
const CACHE_NAME = 'sudoku-pwa-v6';

// Arquivos que compõem o "app shell" e devem funcionar offline
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-512.png'
];

// Instala o Service Worker e faz o cache inicial dos arquivos do app
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS_TO_CACHE))
      .then(() => self.skipWaiting())
  );
});

// Ativa o novo Service Worker e remove caches antigos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// Estratégia: Cache First, com atualização em segundo plano (stale-while-revalidate)
self.addEventListener('fetch', (event) => {
  // Ignora requisições que não sejam GET (ex.: POST) e recursos de outra origem (CDN externo)
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          // Só armazena em cache respostas válidas da mesma origem
          if (networkResponse && networkResponse.status === 200 && event.request.url.startsWith(self.location.origin)) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
          }
          return networkResponse;
        })
        .catch(() => cachedResponse); // Sem internet: usa o que tiver em cache

      // Responde rápido com o cache (se existir) e atualiza por trás
      return cachedResponse || fetchPromise;
    })
  );
});
