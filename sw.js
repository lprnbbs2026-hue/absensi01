// Service Worker — Absensi Dukops
const CACHE_VERSION = 'absensi-v4';
const STATIC_CACHE  = `${CACHE_VERSION}-static`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;

const PRECACHE_URLS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

const OPTIONAL_PRECACHE_URLS = [
  'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js'
];

const NETWORK_ONLY_HOSTS = [
  'script.google.com',
  'wa.me',
  'api.whatsapp.com',
  'drive.google.com',
  'docs.google.com',
  'buleleng01.pages.dev'
];

// ---------- INSTALL ----------
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(STATIC_CACHE);

    await Promise.all(PRECACHE_URLS.map(url =>
      cache.add(url).catch(err => console.warn('[SW] Precache gagal:', url, err))
    ));

    await Promise.all(OPTIONAL_PRECACHE_URLS.map(url =>
      cache.add(url).catch(err => console.warn('[SW] Optional cache gagal:', url, err))
    ));

    await self.skipWaiting();
  })());
});

// ---------- ACTIVATE ----------
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys
        .filter(k => k !== STATIC_CACHE && k !== RUNTIME_CACHE)
        .map(k => caches.delete(k))
    );
    await self.clients.claim();
  })());
});

// ---------- FETCH ----------
self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;

  let url;
  try { url = new URL(request.url); } catch { return; }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return;

  if (NETWORK_ONLY_HOSTS.some(h => url.hostname === h || url.hostname.endsWith('.' + h))) {
    return; // biarkan browser handle langsung
  }

  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request));
    return;
  }

  if (url.origin === self.location.origin) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  event.respondWith(staleWhileRevalidate(request, RUNTIME_CACHE));
});

// ---------- STRATEGI ----------
async function networkFirst(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  try {
    const fresh = await fetch(request);
    if (fresh && fresh.status === 200) cache.put(request, fresh.clone());
    return fresh;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;
    if (request.mode === 'navigate') {
      const fallback = await caches.match('./index.html');
      if (fallback) return fallback;
    }
    return new Response('Offline', { status: 503, statusText: 'Offline' });
  }
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  try {
    const fresh = await fetch(request);
    if (fresh && fresh.status === 200 && fresh.type === 'basic') {
      cache.put(request, fresh.clone());
    }
    return fresh;
  } catch (err) {
    const fallback = await caches.match(request);
    if (fallback) return fallback;
    throw err;
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  const networkPromise = fetch(request).then(response => {
    if (response && response.status === 200 &&
        (response.type === 'cors' || response.type === 'basic')) {
      cache.put(request, response.clone());
    }
    return response;
  }).catch(() => null);

  if (cached) return cached;
  const fresh = await networkPromise;
  if (fresh) return fresh;
  return new Response('Offline', { status: 503, statusText: 'Offline' });
}
