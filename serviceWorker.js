importScripts('https://storage.googleapis.com/workbox-cdn/releases/5.1.2/workbox-sw.js');

workbox.setConfig({debug: false})
const { ExpirationPlugin } = workbox.expiration;
const { registerRoute } = workbox.routing;
const { CacheFirst, NetworkFirst, StaleWhileRevalidate } = workbox.strategies;
const { CacheableResponse, CacheableResponsePlugin } = workbox.cacheableResponse;
const googleAnalytics = workbox.googleAnalytics;
googleAnalytics.initialize();
registerRoute(/\.(?:js|css)$/, new NetworkFirst({cacheName: 'static-cache'}));
registerRoute(new RegExp('https://fonts.googleapis.com/.+'), new StaleWhileRevalidate({cacheName: 'static-cache'}));
registerRoute(new RegExp('https:.*min\.(css|js)'), new CacheFirst({cacheName: 'static-cache'}));
registerRoute(/\.(?:png|jpg|jpeg|svg|gif|ico|webp)$/,
    new CacheFirst({
        cacheName: 'images-cache',
        plugins: [
            new ExpirationPlugin({
                maxEntries: 30,
                maxAgeSeconds: 7 * 24 * 60 * 60,
            })
        ]
    })
);

registerRoute(
    ({url}) => url.origin === 'https://api.box.com' && !url.pathname.includes('/oauth2/token'),
    new NetworkFirst({
        cacheName: 'api-cache',
        plugins: [
            new CacheableResponsePlugin({
                statuses: [200],
            }),
            new ExpirationPlugin({
                maxAgeSeconds: 7 * 24 * 60 * 60,
            })
        ]
    })
);

workbox.precaching.precacheAndRoute([
        {url: 'index.html', revision: 'v2.5.1'},
        {url: 'confluence.js', revision:'v2.5.1'}
    ]
);
