import React, { useState, useEffect, useCallback } from 'react';
import { fetchPodcast } from './services/rssService';
import type { Podcast, Episode } from './types';
import Header from './components/Header';
import EpisodeList from './components/EpisodeList';
import Player from './components/Player';
import LoadingSpinner from './components/LoadingSpinner';

const FEED_URL = 'https://anchor.fm/s/2d3bd0d0/podcast/rss';
const AUDIO_CACHE_NAME = 'audio-cache-v1';
const PROXY_URL = 'https://corsproxy.io/?';

const App: React.FC = () => {
  const [podcast, setPodcast] = useState<Podcast | null>(null);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [currentEpisodeIndex, setCurrentEpisodeIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [cachedEpisodes, setCachedEpisodes] = useState<Set<string>>(new Set());
  const [downloadingEpisodes, setDownloadingEpisodes] = useState<Set<string>>(new Set());

  // Check for cached episodes on initial load
  useEffect(() => {
    const checkCachedEpisodes = async () => {
      if ('caches' in window) {
        try {
          const cache = await caches.open(AUDIO_CACHE_NAME);
          const requests = await cache.keys();
          const urls = requests.map(req => req.url.split('?')[0]); // Ignore query params
          setCachedEpisodes(new Set(urls));
        } catch (err) {
            console.error("Error accessing cache:", err);
        }
      }
    };
    checkCachedEpisodes();
  }, []);

  // Listen for online/offline status changes
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);


  useEffect(() => {
    const getPodcastData = async () => {
      try {
        setLoading(true);
        const { podcast: podcastInfo, episodes: episodeList } = await fetchPodcast(FEED_URL);
        setPodcast(podcastInfo);
        setEpisodes(episodeList);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch podcast data:", err);
        setError("Could not load the podcast feed. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    getPodcastData();
  }, []);
  
  const handleDownloadEpisode = useCallback(async (episode: Episode) => {
    if (!('caches' in window)) {
      alert('Offline playback is not supported by your browser.');
      return;
    }
    setDownloadingEpisodes(prev => new Set(prev).add(episode.audioUrl));
    try {
      // Use the proxy to fetch the audio file to bypass CORS issues.
      const proxiedUrl = `${PROXY_URL}${encodeURIComponent(episode.audioUrl)}`;
      const response = await fetch(proxiedUrl);

      if (!response.ok) {
        throw new Error(`Failed to fetch audio for caching: ${response.statusText}`);
      }
      
      const cache = await caches.open(AUDIO_CACHE_NAME);
      // Cache the fetched response against the original, non-proxied URL.
      // This is crucial so the service worker can find it when the audio player requests the original URL.
      await cache.put(episode.audioUrl, response);

      setCachedEpisodes(prev => new Set(prev).add(episode.audioUrl.split('?')[0]));
    } catch (err) {
      console.error('Failed to cache episode:', err);
      alert('Failed to download episode. Please check your connection and try again.');
    } finally {
      setDownloadingEpisodes(prev => {
        const newSet = new Set(prev);
        newSet.delete(episode.audioUrl);
        return newSet;
      });
    }
  }, []);

  const handleDeleteEpisode = useCallback(async (episode: Episode) => {
    if (!('caches' in window)) return;
    try {
        const cache = await caches.open(AUDIO_CACHE_NAME);
        await cache.delete(episode.audioUrl, { ignoreSearch: true });
        setCachedEpisodes(prev => {
            const newSet = new Set(prev);
            // Normalize URL for deletion check
            const urlWithoutQuery = episode.audioUrl.split('?')[0];
            for (const url of newSet) {
               if(url.split('?')[0] === urlWithoutQuery) {
                   newSet.delete(url);
               }
            }
            return newSet;
        });
    } catch (err) {
        console.error('Failed to delete cached episode:', err);
        alert('Could not remove the downloaded episode.');
    }
  }, []);


  const handleSelectEpisode = useCallback((index: number) => {
    const episode = episodes[index];
    const isCached = cachedEpisodes.has(episode.audioUrl.split('?')[0]);
    if (!isOnline && !isCached) {
        alert("This episode is not downloaded and you are offline.");
        return;
    }
    setCurrentEpisodeIndex(index);
  }, [episodes, isOnline, cachedEpisodes]);

  const handleNext = useCallback(() => {
    if (currentEpisodeIndex !== null) {
      let nextIndex = (currentEpisodeIndex + 1) % episodes.length;
      // Skip unavailable offline episodes
      while(!isOnline && !cachedEpisodes.has(episodes[nextIndex].audioUrl.split('?')[0])) {
        nextIndex = (nextIndex + 1) % episodes.length;
        if (nextIndex === currentEpisodeIndex) return; // Full circle, no other episodes available
      }
      setCurrentEpisodeIndex(nextIndex);
    }
  }, [currentEpisodeIndex, episodes, isOnline, cachedEpisodes]);

  const handlePrev = useCallback(() => {
    if (currentEpisodeIndex !== null) {
      let prevIndex = (currentEpisodeIndex - 1 + episodes.length) % episodes.length;
      // Skip unavailable offline episodes
      while(!isOnline && !cachedEpisodes.has(episodes[prevIndex].audioUrl.split('?')[0])) {
        prevIndex = (prevIndex - 1 + episodes.length) % episodes.length;
        if (prevIndex === currentEpisodeIndex) return; // Full circle, no other episodes available
      }
      setCurrentEpisodeIndex(prevIndex);
    }
  }, [currentEpisodeIndex, episodes, isOnline, cachedEpisodes]);

  const currentEpisode = currentEpisodeIndex !== null ? episodes[currentEpisodeIndex] : null;

  return (
    <div className="min-h-screen bg-orange-50 font-sans text-gray-800">
        {!isOnline && (
            <div className="bg-yellow-500 text-white text-center p-2 font-semibold sticky top-0 z-50 shadow-md">
                You are offline. Only downloaded episodes are available.
            </div>
        )}
      <div className="container mx-auto p-4 md:p-8 max-w-5xl">
        {loading && <LoadingSpinner />}
        {error && <div className="text-center p-8 bg-red-100 text-red-700 rounded-lg">{error}</div>}
        
        {!loading && !error && podcast && (
          <>
            <Header podcast={podcast} />
            <main className="mt-8">
              <EpisodeList 
                episodes={episodes} 
                onSelectEpisode={handleSelectEpisode}
                currentEpisodeUrl={currentEpisode?.audioUrl}
                onDownloadEpisode={handleDownloadEpisode}
                onDeleteEpisode={handleDeleteEpisode}
                cachedEpisodes={cachedEpisodes}
                downloadingEpisodes={downloadingEpisodes}
                isOnline={isOnline}
              />
            </main>
          </>
        )}
      </div>

      {currentEpisode && (
        <Player 
          episode={currentEpisode} 
          onNext={handleNext} 
          onPrev={handlePrev}
          onEnded={handleNext}
        />
      )}
    </div>
  );
};

export default App;