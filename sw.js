// African Children's Stories - Service Worker v2
const CACHE_NAME = 'acs-podcast-v2';
const AUDIO_CACHE = 'acs-audio-v2';

// Assets to pre-cache on install
const STATIC_ASSETS = [
  './african-childrens-stories-podcast.html',
  './sw.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME && k !== AUDIO_CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Audio files — cache on first play, serve from cache offline
  if (event.request.url.includes('.mp3') || event.request.url.includes('.m4a') || event.request.url.includes('audio')) {
    event.respondWith(
      caches.open(AUDIO_CACHE).then(cache =>
        cache.match(event.request).then(cached => {
          if (cached) return cached;
          return fetch(event.request).then(response => {
            // Only cache successful audio responses
            if (response.ok && response.status === 200) {
              cache.put(event.request, response.clone());
            }
            return response;
          }).catch(() => cached || new Response('Audio unavailable offline', { status: 503 }));
        })
      )
    );
    return;
  }

  // RSS/API calls — network first, fall back to cache
  if (url.hostname.includes('rss2json') || url.hostname.includes('allorigins') || url.hostname.includes('corsproxy')) {
    event.respondWith(
      fetch(event.request).then(response => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        return response;
      }).catch(() => caches.match(event.request))
    );
    return;
  }

  // Static assets — cache first
  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
      if (response.ok) {
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
      }
      return response;
    }).catch(() => caches.match('./african-childrens-stories-podcast.html')))
  );
});

// Message handler: cache a specific audio episode
self.addEventListener('message', event => {
  if (event.data.type === 'CACHE_AUDIO') {
    const { url } = event.data;
    caches.open(AUDIO_CACHE).then(cache =>
      cache.match(url).then(existing => {
        if (!existing) {
          fetch(url).then(response => {
            if (response.ok) cache.put(url, response);
          }).catch(() => {});
        }
      })
    );
  }
  if (event.data.type === 'GET_CACHED_AUDIO') {
    caches.open(AUDIO_CACHE).then(cache =>
      cache.keys().then(keys => {
        event.source.postMessage({ type: 'CACHED_AUDIO_LIST', urls: keys.map(k => k.url) });
      })
    );
  }
});
