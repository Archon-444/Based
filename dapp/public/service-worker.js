/* eslint-disable no-restricted-globals */
/**
 * Based Service Worker
 *
 * Provides offline support, caching, and push notifications
 * for the PWA experience.
 */

const CACHE_NAME = 'based-v1';
const RUNTIME_CACHE = 'based-runtime-v1';

// Assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/offline.html',
];

// Cache-first resources (images, fonts)
const CACHE_FIRST_PATTERNS = [
  /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
  /\.(?:woff|woff2|ttf|eot)$/,
];

// Network-first resources (API calls)
const NETWORK_FIRST_PATTERNS = [
  /\/api\//,
  /base\.org/,
];

// NEVER cache these (sensitive data, auth, private endpoints)
const NEVER_CACHE_PATTERNS = [
  /\/api\/auth\//,          // Authentication endpoints
  /\/api\/keys\//,          // API keys
  /\/api\/private\//,       // Private data
  /\/api\/wallet\//,        // Wallet operations
  /\/api\/user\//,          // User private data
  /\/api\/push\/subscribe/, // Push subscriptions
  /\/api\/transaction\//,   // Transaction data
  /\?.*token=/,             // URLs with tokens
  /\?.*key=/,               // URLs with keys
  /\?.*secret=/,            // URLs with secrets
  /\?.*auth=/,              // URLs with auth params
  /\?.*credentials=/,       // URLs with credentials
];

/**
 * Install Event - Cache static assets
 */
self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] Installing...');

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[ServiceWorker] Caching static assets');
      return cache.addAll(STATIC_ASSETS);
    }).then(() => {
      // Activate immediately
      return self.skipWaiting();
    })
  );
});

/**
 * Activate Event - Clean up old caches
 */
self.addEventListener('activate', (event) => {
  console.log('[ServiceWorker] Activating...');

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== RUNTIME_CACHE)
          .map((name) => {
            console.log('[ServiceWorker] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    }).then(() => {
      // Take control of all pages immediately
      return self.clients.claim();
    })
  );
});

/**
 * Fetch Event - Serve from cache or network
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome extensions
  if (url.protocol === 'chrome-extension:') {
    return;
  }

  // NEVER cache sensitive endpoints - always fetch fresh
  if (shouldNeverCache(url)) {
    event.respondWith(fetch(request));
    return;
  }

  // Determine caching strategy based on URL
  if (shouldCacheFirst(url)) {
    event.respondWith(cacheFirst(request));
  } else if (shouldNetworkFirst(url)) {
    event.respondWith(networkFirst(request));
  } else {
    event.respondWith(staleWhileRevalidate(request));
  }
});

/**
 * Cache-First Strategy
 * Best for: Images, fonts, static assets
 */
async function cacheFirst(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cached = await cache.match(request);

  if (cached) {
    console.log('[ServiceWorker] Cache hit:', request.url);
    return cached;
  }

  try {
    const response = await fetch(request);

    // Cache successful responses
    if (response.status === 200) {
      cache.put(request, response.clone());
    }

    return response;
  } catch (error) {
    console.error('[ServiceWorker] Fetch failed:', error);

    // Return offline fallback if available
    return caches.match('/offline.html') || new Response('Offline');
  }
}

/**
 * Network-First Strategy
 * Best for: API calls, dynamic data
 */
async function networkFirst(request) {
  const cache = await caches.open(RUNTIME_CACHE);

  try {
    const response = await fetch(request);

    // Cache successful responses
    if (response.status === 200) {
      cache.put(request, response.clone());
    }

    return response;
  } catch (error) {
    console.log('[ServiceWorker] Network failed, using cache:', request.url);

    const cached = await cache.match(request);

    if (cached) {
      return cached;
    }

    // Return offline fallback
    return new Response(JSON.stringify({ error: 'Offline' }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

/**
 * Stale-While-Revalidate Strategy
 * Best for: HTML pages, CSS, JS
 */
async function staleWhileRevalidate(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cached = await cache.match(request);

  // Fetch from network in background
  const fetchPromise = fetch(request).then((response) => {
    if (response.status === 200) {
      cache.put(request, response.clone());
    }
    return response;
  }).catch(() => {
    // Network failed, return nothing (cached version already returned)
  });

  // Return cached version immediately if available
  return cached || fetchPromise;
}

/**
 * Push Notification Event
 */
self.addEventListener('push', (event) => {
  console.log('[ServiceWorker] Push received');

  const data = event.data ? event.data.json() : {};
  const title = data.title || 'Based';
  const options = {
    body: data.body || 'You have a new notification',
    icon: '/icon-192.png',
    badge: '/icon-96.png',
    tag: data.tag || 'default',
    data: data.url || '/',
    actions: data.actions || [],
    vibrate: [200, 100, 200],
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

/**
 * Notification Click Event
 */
self.addEventListener('notificationclick', (event) => {
  console.log('[ServiceWorker] Notification clicked');

  event.notification.close();

  const urlToOpen = event.notification.data || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Focus existing window if available
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }

      // Open new window
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
    })
  );
});

/**
 * Background Sync Event
 */
// Background sync event
// NOTE: This feature requires a backend API to be fully implemented
// Currently disabled via feature flag in env.ts
self.addEventListener('sync', (event) => {
  console.log('[ServiceWorker] Background sync:', event.tag);

  if (event.tag === 'sync-bets') {
    // Only attempt sync if backend API is configured
    if (self.location.hostname === 'localhost' || self.location.hostname === '127.0.0.1') {
      console.log('[ServiceWorker] Background sync disabled in development');
      return;
    }
    event.waitUntil(syncPendingBets());
  }
});

/**
 * Message Event - Communication with app
 */
self.addEventListener('message', (event) => {
  console.log('[ServiceWorker] Message received:', event.data);

  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((names) => {
        return Promise.all(names.map((name) => caches.delete(name)));
      })
    );
  }

  if (event.data.type === 'INVALIDATE_SENSITIVE_CACHE') {
    // Clear any cached responses that might contain sensitive data
    event.waitUntil(invalidateSensitiveCache());
  }
});

/**
 * Helper Functions
 */

function shouldNeverCache(url) {
  const fullUrl = url.pathname + url.search;
  return NEVER_CACHE_PATTERNS.some((pattern) => pattern.test(fullUrl));
}

function shouldCacheFirst(url) {
  return CACHE_FIRST_PATTERNS.some((pattern) => pattern.test(url.pathname));
}

function shouldNetworkFirst(url) {
  return NETWORK_FIRST_PATTERNS.some((pattern) => pattern.test(url.pathname));
}

async function syncPendingBets() {
  console.log('[ServiceWorker] Syncing pending bets...');

  // Background sync is disabled until backend API is ready
  // When implementing:
  // 1. Open IndexedDB connection to 'pending-bets' store
  // 2. Retrieve all pending bet transactions
  // 3. POST each to /api/sync-bets endpoint
  // 4. Remove successfully synced bets from IndexedDB
  // 5. Retry failed syncs on next sync event

  // For now, this is a no-op to prevent dangling sync registrations
  console.log('[ServiceWorker] Background sync not implemented - skipping');
  return Promise.resolve();
}

async function invalidateSensitiveCache() {
  console.log('[ServiceWorker] Invalidating sensitive cache...');

  const cacheNames = await caches.keys();

  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName);
    const requests = await cache.keys();

    for (const request of requests) {
      const url = new URL(request.url);
      if (shouldNeverCache(url)) {
        console.log('[ServiceWorker] Deleting sensitive cache:', request.url);
        await cache.delete(request);
      }
    }
  }

  return Promise.resolve();
}

console.log('[ServiceWorker] Loaded');
