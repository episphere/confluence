const cacheName = 'confluence';

const staticAssets = [
  '/',
  '/*',
  '/index.html',
  '/confluence.js',
  '/static/css/confluence.css',
  '/static/images/*',
  '/static/js/*',
  '/src/*'
];

self.addEventListener('install', async function () {
    const cache = await caches.open(cacheName);
    cache.addAll(staticAssets);
});

self.addEventListener('activate', event => {
    event.waitUntil(self.clients.claim());
});
  
self.addEventListener('fetch', event => {
    const request = event.request;
    if(request.method === 'POST') return;
    const url = new URL(request.url);
    if (url.origin === location.origin) {
        event.respondWith(cacheFirst(request));
    } else {
        event.respondWith(networkFirst(request));
    }
});
  
async function cacheFirst(request) {
    const cachedResponse = await caches.match(request);
    return cachedResponse || fetch(request);
}
  
async function networkFirst(request) {
    const dynamicCache = await caches.open(cacheName);
    try {
        const networkResponse = await fetch(request);
        dynamicCache.put(request, networkResponse.clone());
        return networkResponse;
    } catch (err) {
        const cachedResponse = await dynamicCache.match(request);
        return cachedResponse || await caches.match('./fallback.json');
    }
}