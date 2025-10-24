const CACHE_NAME = 'african-stories-podcast-v1';
const AUDIO_CACHE_NAME = 'audio-cache-v1';
const FEED_URL = 'https://anchor.fm/s/2d3bd0d0/podcast/rss';
const PROXY_URL_PREFIX = 'https://corsproxy.io/?';

// App Shell files
const APP_SHELL_URLS = [
  '/',
  '/index.html',
  '/index.tsx',
  '/App.tsx',
  '/types.ts',
  '/services/rssService.ts',
  '/components/Header.tsx',
  '/components/EpisodeList.tsx',
  '/components/Player.tsx',
  '/components/LoadingSpinner.tsx',
  'https://cdn.tailwindcss.com',
  'https://aistudiocdn.com/react@^19.2.0',
  'https://aistudiocdn.com/react-dom@^19.2.0/',
  'https://aistudiocdn.com/react@^19.2.0/jsx-runtime',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    Promise.all([
      caches.open(CACHE_NAME).then((cache) => {
        console.log('Opened app shell cache');
        // Use addAll with a catch for individual failures, which are common with external URLs
        return Promise.all(
          APP_SHELL_URLS.map(url => cache.add(new Request(url, {cache: 'reload'})).catch(err => console.warn(`Failed to cache ${url}:`, err)))
        );
      }),
      caches.open(AUDIO_CACHE_NAME).then((cache) => {
        console.log('Opened audio cache');
        return cache;
      })
    ]).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME, AUDIO_CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Audio files: Cache first, then network (via proxy)
  if (request.destination === 'audio' || url.pathname.endsWith('.mp3')) {
    event.respondWith(
      caches.open(AUDIO_CACHE_NAME).then(async (cache) => {
        // We use ignoreSearch: true because audio URLs might have expiring tokens.
        const cachedResponse = await cache.match(request, { ignoreSearch: true });
        if (cachedResponse) {
          return cachedResponse;
        }

        // If not in cache, fetch from network via CORS proxy to avoid CORS errors.
        try {
            const proxiedUrl = `${PROXY_URL_PREFIX}${encodeURIComponent(request.url)}`;
            // We fetch the proxied URL but don't cache it here. Caching is an explicit user action.
            const networkResponse = await fetch(proxiedUrl);
            return networkResponse;
        } catch (error) {
            console.error('Service Worker failed to fetch audio through proxy:', error);
            // Return an error response so the request doesn't just hang.
            return new Response('Audio could not be fetched.', {
              status: 404,
              statusText: 'Audio not found',
            });
        }
      })
    );
    return;
  }

  // Podcast feed: Stale-while-revalidate strategy
  if (request.url.startsWith(PROXY_URL_PREFIX)) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cachedResponse = await cache.match(request);
        const fetchPromise = fetch(request).then((networkResponse) => {
          cache.put(request, networkResponse.clone());
          return networkResponse;
        }).catch(err => {
            console.error("Fetch failed for feed, maybe offline.", err);
            // if fetch fails, and we have a cached response, we should return it.
            if (cachedResponse) return cachedResponse;
        });
        return cachedResponse || fetchPromise;
      })
    );
    return;
  }
  
  // App Shell and other requests: Cache first, then network
  event.respondWith(
    caches.match(request).then((response) => {
      return response || fetch(request).catch(err => {
        console.log('Fetch failed, returning offline page if available', err);
        return caches.match('/');
      });
    })
  );
});