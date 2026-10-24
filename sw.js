const CACHE_NAME = 'absensi-v1';
const ASSETS = ['./', './index.html', './jadwal.html', './admin.html', './manifest.json', './icon-192.png', './icon-512.png', 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js'];

self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || e.request.url.includes('script.google.com')) return;
  e.respondWith(caches.match(e.request).then(c => c || fetch(e.request).then(res => {
    if (res.status === 200) { const clone = res.clone(); caches.open(CACHE_NAME).then(c => c.put(e.request, clone)); }
    return res;
  })));
});
