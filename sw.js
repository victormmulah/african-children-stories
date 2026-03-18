// African Children's Stories — Service Worker v4
const CACHE = 'acs-shell-v4';
const AUDIO_CACHE = 'acs-audio-v4';

const SHELL = ['./african-childrens-stories-podcast.html', './sw.js'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE && k !== AUDIO_CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Audio — cache-first with background fetch
  if (/\.(mp3|m4a|ogg|aac)(\?|$)/i.test(url.pathname) || url.pathname.includes('/audio/')) {
    e.respondWith(
      caches.open(AUDIO_CACHE).then(cache =>
        cache.match(e.request).then(hit => {
          if (hit) return hit;
          return fetch(e.request).then(res => {
            if (res.ok) cache.put(e.request, res.clone());
            return res;
          }).catch(() => new Response('', { status: 503 }));
        })
      )
    );
    return;
  }

  // RSS proxies — network first, stale fallback
  if (url.hostname.includes('rss2json') || url.hostname.includes('allorigins') || url.hostname.includes('corsproxy')) {
    e.respondWith(
      fetch(e.request).then(res => {
        caches.open(CACHE).then(c => c.put(e.request, res.clone()));
        return res;
      }).catch(() => caches.match(e.request))
    );
    return;
  }

  // Google Fonts — cache forever
  if (url.hostname.includes('fonts.')) {
    e.respondWith(
      caches.match(e.request).then(hit => hit || fetch(e.request).then(res => {
        caches.open(CACHE).then(c => c.put(e.request, res.clone()));
        return res;
      }))
    );
    return;
  }

  // App shell — cache first
  e.respondWith(
    caches.match(e.request).then(hit => hit || fetch(e.request).then(res => {
      if (res.ok) caches.open(CACHE).then(c => c.put(e.request, res.clone()));
      return res;
    }).catch(() => caches.match('./african-childrens-stories-podcast.html')))
  );
});

// Message bridge
self.addEventListener('message', e => {
  if (e.data.type === 'SKIP_WAITING') self.skipWaiting();
  if (e.data.type === 'GET_CACHED_AUDIO') {
    caches.open(AUDIO_CACHE).then(c => c.keys()).then(keys => {
      e.source.postMessage({ type: 'CACHED_AUDIO', urls: keys.map(k => k.url) });
    });
  }
});
