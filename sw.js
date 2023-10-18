const cacheName = 'toilet-parks-v1';
const files = [
    '/',
    '/index.html',
    '/about.html',
    '/styles.css',
    '/manifest.json',
    '/browserconfig.xml',
    '/android-icon-36x36.png',
    '/android-icon-48x48.png',
    '/android-icon-72x72.png',
    '/android-icon-96x96.png',
    '/android-icon-144x144.png',
    '/android-icon-192x192.png',
    '/apple-icon-57x57.png',
    '/apple-icon-60x60.png',
    '/apple-icon-72x72.png',
    '/apple-icon-76x76.png',
    '/apple-icon-114x114.png',
    '/apple-icon-120x120.png',
    '/apple-icon-144x144.png',
    '/apple-icon-152x152.png',
    '/apple-icon-180x180.png',
    '/apple-icon-precomposed.png',
    '/apple-icon.png',
    '/favicon-16x16.png',
    '/favicon-32x32.png',
    '/favicon-96x96.png',
    '/favicon.ico',
    '/icons8-toilet-64.png',
    '/ms-icon-70x70.png',
    '/ms-icon-144x144.png',
    '/ms-icon-150x150.png',
    '/ms-icon-310x310.png'
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
