const CACHE_NAME = '404-master-cache-v11';
const urlsToCache = [
  './',
  './index.html',
  './database.js',
  './manifest.json',
  './icon-192x192.png',
  './icon-512x512.png',
  './assets/cute_seed_transparent.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting(); // 즉시 새로운 서비스 워커 설치
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('기존 캐시 삭제:', cacheName);
            return caches.delete(cacheName); // 이전 버전 캐시 삭제
          }
        })
      );
    })
  );
  self.clients.claim(); // 즉시 제어권 확보
});

self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // 네트워크 성공 시 새로운 데이터로 캐시 업데이트
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseClone);
        });
        return response;
      })
      .catch(() => {
        // 오프라인이거나 네트워크 실패 시 기존 캐시 반환
        return caches.match(event.request);
      })
  );
});
