// sentinelWorker.js - SentinelAI Background Service Worker & Intent Router

const CACHE_NAME = 'sentinelai-security-v1';

self.addEventListener('install', (event) => {
    console.log('[SentinelWorker] Installing background security worker...');
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(['/', '/index.html']);
        }).then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    console.log('[SentinelWorker] Background worker activated.');
    event.waitUntil(self.clients.claim());
});

// Intercept background push notifications
self.addEventListener('push', (event) => {
    let notificationData = {
        title: 'SentinelAI Security Alert',
        body: 'A background threat or patch anomaly was detected.',
        priority: 'high',
        intentAction: 'sentinelai://announcer'
    };

    if (event.data) {
        try {
            notificationData = { ...notificationData, ...event.data.json() };
        } catch (e) {
            notificationData.body = event.data.text();
        }
    }

    event.waitUntil(
        self.registration.showNotification(notificationData.title, {
            body: notificationData.body,
            icon: '/favicon.ico',
            badge: '/favicon.ico',
            tag: 'sentinel-alert',
            data: { intentAction: notificationData.intentAction }
        })
    );
});

// Handle notification interaction & deep link intent routing
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const intentAction = event.notification.data?.intentAction || 'sentinelai://announcer';

    event.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            for (const client of clientList) {
                if ('focus' in client) {
                    client.postMessage({ type: 'SENTINEL_BACKGROUND_INTENT', action: intentAction });
                    return client.focus();
                }
            }
            if (self.clients.openWindow) {
                return self.clients.openWindow(`/?intent=${encodeURIComponent(intentAction)}`);
            }
        })
    );
});
