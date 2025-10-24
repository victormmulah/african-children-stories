import React from 'react';
import type { Episode } from '../types';

interface EpisodeListProps {
  episodes: Episode[];
  onSelectEpisode: (index: number) => void;
  currentEpisodeUrl?: string | null;
  onDownloadEpisode: (episode: Episode) => void;
  onDeleteEpisode: (episode: Episode) => void;
  cachedEpisodes: Set<string>;
  downloadingEpisodes: Set<string>;
  isOnline: boolean;
}

const PlayIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M8 5v14l11-7z"></path></svg>
);

const SoundwaveIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <rect x="4" y="8" width="4" height="8" fill="currentColor"><animate attributeName="height" values="8;16;8" dur="1.2s" repeatCount="indefinite" begin="0.1s"/><animate attributeName="y" values="8;4;8" dur="1.2s" repeatCount="indefinite" begin="0.1s"/></rect>
        <rect x="10" y="4" width="4" height="16" fill="currentColor"><animate attributeName="height" values="16;8;16" dur="1.2s" repeatCount="indefinite" begin="0.2s"/><animate attributeName="y" values="4;8;4" dur="1.2s" repeatCount="indefinite" begin="0.2s"/></rect>
        <rect x="16" y="8" width="4" height="8" fill="currentColor"><animate attributeName="height" values="8;16;8" dur="1.2s" repeatCount="indefinite" begin="0.3s"/><animate attributeName="y" values="8;4;8" dur="1.2s" repeatCount="indefinite" begin="0.3s"/></rect>
    </svg>
);

const DownloadIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
);

const CheckCircleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>
);

const TrashIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
);

const DownloadingSpinner: React.FC<{ className?: string }> = ({ className }) => (
  <div className={`aspect-square w-full h-full rounded-full border-2 border-transparent border-t-orange-500 animate-spin ${className}`}></div>
);


const EpisodeList: React.FC<EpisodeListProps> = ({ episodes, onSelectEpisode, currentEpisodeUrl, onDownloadEpisode, onDeleteEpisode, cachedEpisodes, downloadingEpisodes, isOnline }) => {
  return (
    <div className="bg-white rounded-2xl shadow-lg border border-orange-200 p-6">
      <h2 className="text-3xl font-bold text-gray-800 mb-6">Episodes</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
        {episodes.map((episode, index) => {
          const isPlaying = currentEpisodeUrl === episode.audioUrl;
          const isCached = cachedEpisodes.has(episode.audioUrl.split('?')[0]);
          const isDownloading = downloadingEpisodes.has(episode.audioUrl);
          const isAvailableOffline = isOnline || isCached;

          return (
            <div
              key={episode.audioUrl}
              className={`group rounded-lg overflow-hidden shadow-sm transition-all duration-300 relative ${isAvailableOffline ? 'cursor-pointer hover:shadow-xl transform hover:-translate-y-1' : 'opacity-50 cursor-not-allowed'} ${isPlaying ? 'ring-2 ring-orange-500' : 'ring-1 ring-gray-200/50'}`}
              onClick={() => isAvailableOffline && onSelectEpisode(index)}
              aria-current={isPlaying ? 'true' : 'false'}
              aria-disabled={!isAvailableOffline}
            >
              <div className="relative">
                <img src={episode.imageUrl} alt={episode.title} className="w-full aspect-square object-cover" />
                <div className={`absolute inset-0 bg-black flex items-center justify-center transition-all duration-300 ${isAvailableOffline ? 'bg-opacity-0 group-hover:bg-opacity-60' : 'bg-opacity-30'}`}>
                  {isAvailableOffline && (
                    <>
                      {isPlaying ? (
                        <SoundwaveIcon className="w-12 h-12 text-white" />
                      ) : (
                        <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transform group-hover:scale-110 transition-all duration-300">
                          <PlayIcon className="w-8 h-8" />
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
              <div className="p-3 bg-white">
                <h3 className={`font-bold text-sm truncate ${isPlaying ? 'text-orange-600' : 'text-gray-800'}`}>
                  {episode.title}
                </h3>
                <p className="text-xs text-gray-500 mt-1">{episode.pubDate}</p>
              </div>

              <div className="absolute top-2 right-2 flex items-center space-x-1">
                {isDownloading ? (
                   <div className="w-8 h-8 p-1.5 bg-white/80 rounded-full shadow-md"><DownloadingSpinner /></div>
                ) : isCached ? (
                  <>
                    <span className="text-green-500 bg-white/80 rounded-full p-1 shadow-md"><CheckCircleIcon className="w-6 h-6" /></span>
                    <button onClick={(e) => {e.stopPropagation(); onDeleteEpisode(episode);}} className="p-1.5 rounded-full bg-white/80 text-red-500 hover:bg-red-500 hover:text-white shadow-md transition-colors" aria-label="Delete offline copy"><TrashIcon className="w-5 h-5"/></button>
                  </>
                ) : isOnline ? (
                  <button onClick={(e) => {e.stopPropagation(); onDownloadEpisode(episode);}} className="p-1.5 rounded-full bg-white/80 text-orange-600 hover:bg-orange-500 hover:text-white shadow-md transition-colors opacity-0 group-hover:opacity-100" aria-label="Download for offline playback"><DownloadIcon className="w-5 h-5"/></button>
                ) : null}
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
};

export default EpisodeList;
