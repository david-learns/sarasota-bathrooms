const cacheName = 'toilet-parks-v3';
const files = [
    '/',
    '/index.html',
    '/about.html',
    '/app.js',
    '/styles.css',
    '/manifest.json',
    '/browserconfig.xml',
    '/images/android-icon-36x36.png',
    '/images/android-icon-48x48.png',
    '/images/android-icon-72x72.png',
    '/images/android-icon-96x96.png',
    '/images/android-icon-144x144.png',
    '/images/android-icon-192x192.png',
    '/images/apple-icon-57x57.png',
    '/images/apple-icon-60x60.png',
    '/images/apple-icon-72x72.png',
    '/images/apple-icon-76x76.png',
    '/images/apple-icon-114x114.png',
    '/images/apple-icon-120x120.png',
    '/images/apple-icon-144x144.png',
    '/images/apple-icon-152x152.png',
    '/images/apple-icon-180x180.png',
    '/images/apple-icon-precomposed.png',
    '/images/apple-icon.png',
    '/images/favicon-16x16.png',
    '/images/favicon-32x32.png',
    '/images/favicon-96x96.png',
    '/images/favicon.ico',
    '/images/icons8-toilet-64.png',
    '/images/ms-icon-70x70.png',
    '/images/ms-icon-144x144.png',
    '/images/ms-icon-150x150.png',
    '/images/ms-icon-310x310.png'
];

self.addEventListener('install', e => {
    e.waitUntil(
        (async () => {
            const cache = await caches.open(cacheName);
            await cache.addAll(files);
        })(),
    );
});

self.addEventListener('fetch', e => {
    e.respondWith(
        (async () => {
            const cacheRes = await caches.match(e.request);
            if (cacheRes) return cacheRes;
            const res = await fetch(e.request);
            const cache = await caches.open(cacheName);
            cache.put(e.request, res.clone());
            return res;
        })(),
    );
});

self.addEventListener('activate', e => {
    e.waitUntil(
        caches.keys().then(keyList => {
            return Promise.all(
                keyList.map(key => {
                    if (key === cacheName) return;
                    return caches.delete(key);
                }),
            );
        }),
    );
});
