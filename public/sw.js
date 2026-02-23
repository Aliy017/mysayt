const CACHE_NAME = 'mysayt-v1';
const STATIC_ASSETS = [
    '/',
    '/admin/dashboard',
    '/admin/leads',
    '/admin/sites',
    '/admin/team',
    '/admin/notifications',
    '/admin/settings',
    '/icons/icon-192.png',
    '/icons/icon-512.png',
];

// Install — static assets ni cache qilish
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(STATIC_ASSETS).catch(() => {
                // Bazi sahifalar hali mavjud bo'lmasligi mumkin
                console.log('Some assets could not be cached');
            });
        })
    );
    self.skipWaiting();
});

// Activate — eski cache ni tozalash
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
            );
        })
    );
    self.clients.claim();
});

// Fetch — Network first, fallback to cache
self.addEventListener('fetch', (event) => {
    const { request } = event;

    // API so'rovlarini cache qilmaslik
    if (request.url.includes('/api/')) {
        return;
    }

    // Faqat GET so'rovlarni cache qilish
    if (request.method !== 'GET') {
        return;
    }

    event.respondWith(
        fetch(request)
            .then((response) => {
                // Javobni cache ga saqlash
                if (response.status === 200) {
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(request, responseClone);
                    });
                }
                return response;
            })
            .catch(() => {
                // Offline — cache dan olish
                return caches.match(request).then((cached) => {
                    return cached || new Response('Offline', { status: 503 });
                });
            })
    );
});

// Notification click — Arizalar sahifasiga o'tish
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            // Ochiq tab bormi?
            for (const client of clientList) {
                if (client.url.includes('/admin') && 'focus' in client) {
                    client.navigate('/admin/leads');
                    return client.focus();
                }
            }
            // Yangi tab ochish
            return self.clients.openWindow('/admin/leads');
        })
    );
});
