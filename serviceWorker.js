importScripts('https://storage.googleapis.com/workbox-cdn/releases/5.1.2/workbox-sw.js');

const { registerRoute } = workbox.routing;
const { CacheFirst, NetworkFirst, StaleWhileRevalidate } = workbox.strategies;
const { CacheableResponse, CacheableResponsePlugin } = workbox.cacheableResponse;
const { ExpirationPlugin } = workbox.expiration;
const googleAnalytics = workbox.googleAnalytics;

googleAnalytics.initialize();

registerRoute(new RegExp('.+\\.js$'), new NetworkFirst());
registerRoute(new RegExp('.+\\.css$'), new StaleWhileRevalidate({cacheName: 'css-cache'}));
registerRoute(/\.(?:png|jpg|jpeg|svg|gif)$/,
    new CacheFirst({
        cacheName: 'image-cache',
        plugins: [
            new ExpirationPlugin({
                maxEntries: 20,
                maxAgeSeconds: 7 * 24 * 60 * 60,
            })
        ]
    })
);

registerRoute(
    new RegExp('https://api.box.com/.+'),
    new NetworkFirst({
        cacheName: 'api-cache',
        plugins: [
            new CacheableResponsePlugin({
            statuses: [0, 200],
            })
        ]
    })
);