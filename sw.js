// Offline support for the 69kV Rehab Tracker.
// Keeps the app, the confirm page, and the libraries (Firebase, Excel, PDF) on the phone,
// so the app opens and exports work without internet.
const CACHE = 'rehab-offline-v1';
const CORE = ['./', './index.html', './confirm.html'];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(CORE).catch(() => {}))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Pages: try the network first, keep a copy, and use the copy when offline
  if (url.origin === self.location.origin && req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then(res => {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req).then(r => r || caches.match('./index.html')))
    );
    return;
  }

  // Libraries from the CDN: use the copy when there is one, otherwise fetch and keep it
  if (/gstatic\.com|cdn\.jsdelivr\.net|cdnjs\.cloudflare\.com/.test(url.host)) {
    event.respondWith(
      caches.match(req).then(hit => hit || fetch(req).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy));
        return res;
      }))
    );
  }
});
