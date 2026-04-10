// ============================================================
// Cogno Solution - Service Worker
// Version: 1.2.0
// ============================================================

const CACHE_NAME = 'cogno-solution-v1.2.0';
const OFFLINE_PAGE = '/offline.html';

// Core files to cache on install (app shell)
const APP_SHELL = [
  '/',
  '/index.html',
  '/css/',
  '/assets/images/icons/favicon.svg',
  '/assets/images/icons/logo.svg',
  '/assets/images/cognosolutionlogo.png',
  '/site.webmanifest',
];

// ── Install: cache the app shell ──────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(APP_SHELL).catch((err) => {
        console.warn('[SW] Some shell files failed to cache:', err);
      });
    })
  );
  self.skipWaiting();
});

// ── Activate: clean up old caches ────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// ── Fetch: network-first for API/HTML, cache-first for assets ─
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET and cross-origin requests (except fonts/CDN)
  if (request.method !== 'GET') return;

  // Always go network-first for HTML pages and API calls
  if (
    request.headers.get('Accept')?.includes('text/html') ||
    url.pathname.includes('/api/') ||
    url.hostname.includes('supabase')
  ) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Cache-first for static assets (images, fonts, CSS, JS)
  event.respondWith(cacheFirst(request));
});

// ── Strategy: Network First ───────────────────────────────────
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response && response.status === 200) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    return cached || caches.match('/index.html');
  }
}

// ── Strategy: Cache First ─────────────────────────────────────
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response && response.status === 200) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('Resource not available offline.', { status: 503 });
  }
}

// ── Push Notifications (future use) ──────────────────────────
self.addEventListener('push', (event) => {
  const data = event.data?.json() || {};
  const title = data.title || 'Cogno Solution';
  const options = {
    body: data.body || 'You have a new notification.',
    icon: '/assets/images/icons/logo.svg',
    badge: '/assets/images/icons/favicon.svg',
    vibrate: [200, 100, 200],
    data: { url: data.url || '/' },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data.url));
});
