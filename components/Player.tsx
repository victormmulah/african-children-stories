import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { Episode } from '../types';

interface PlayerProps {
  episode: Episode;
  onNext: () => void;
  onPrev: () => void;
  onEnded: () => void;
}

const PlayIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20"><path d="M4.018 14.386L13.483 9.998 4.018 5.61a.998.998 0 010-1.724l13.136-7.228a1 1 0 011.365 1.002v16.68a1 1 0 01-1.365 1.002L4.018 16.11a.998.998 0 010-1.724z"></path></svg>
);
const PauseIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10 0a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1z" clipRule="evenodd"></path></svg>
);
const NextIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20"><path d="M10.755 2.168A1.5 1.5 0 008.25 3.5v5.03l-4.42-3.157a1.5 1.5 0 00-2.096 1.884l4.162 7.798-4.162 7.798a1.5 1.5 0 002.096 1.884l4.42-3.157v5.03a1.5 1.5 0 002.505 1.332l6.932-6.28a1.5 1.5 0 000-2.664L10.755 2.168z"></path></svg>
);
const PrevIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20"><path d="M9.245 2.168A1.5 1.5 0 0111.75 3.5v5.03l4.42-3.157a1.5 1.5 0 012.096 1.884l-4.162 7.798 4.162 7.798a1.5 1.5 0 01-2.096 1.884l-4.42-3.157v5.03a1.5 1.5 0 01-2.505 1.332l-6.932-6.28a1.5 1.5 0 010-2.664L9.245 2.168z"></path></svg>
);
const RewindIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
        <path d="M8.445 14.832A1 1 0 0010 14.03V5.97a1 1 0 00-1.555-.832L3.12 9.168a1 1 0 000 1.664l5.325 4.032zM15.445 14.832A1 1 0 0017 14.03V5.97a1 1 0 00-1.555-.832L10.12 9.168a1 1 0 000 1.664l5.325 4.032z"></path>
    </svg>
);
const ForwardIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
        <path d="M4.555 5.168A1 1 0 003 5.97v8.06a1 1 0 001.555.832l5.325-4.032a1 1 0 000-1.664L4.555 5.168zM11.555 5.168A1 1 0 0010 5.97v8.06a1 1 0 001.555.832l5.325-4.032a1 1 0 000-1.664l-5.325-4.032z"></path>
    </svg>
);

const Player: React.FC<PlayerProps> = ({ episode, onNext, onPrev, onEnded }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const togglePlayPause = useCallback(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(error => console.error("Audio play failed:", error));
      }
      setIsPlaying(!isPlaying);
    }
  }, [isPlaying]);

  const handleSkip = (seconds: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(0, Math.min(duration, audioRef.current.currentTime + seconds));
    }
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const setAudioData = () => {
      setDuration(audio.duration);
      setCurrentTime(audio.currentTime);
    };

    const setAudioTime = () => setCurrentTime(audio.currentTime);
    
    audio.addEventListener('loadeddata', setAudioData);
    audio.addEventListener('timeupdate', setAudioTime);
    audio.addEventListener('ended', onEnded);

    // Auto-play new episode
    audio.play().then(() => setIsPlaying(true)).catch(e => console.log("Autoplay blocked"));

    return () => {
      audio.removeEventListener('loadeddata', setAudioData);
      audio.removeEventListener('timeupdate', setAudioTime);
      audio.removeEventListener('ended', onEnded);
    };
  }, [episode, onEnded]);

  const onScrub = (value: string) => {
    if (audioRef.current) {
        audioRef.current.currentTime = Number(value);
        setCurrentTime(Number(value));
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50">
      <div className="bg-white/80 backdrop-blur-md shadow-[0_-5px_20px_-5px_rgba(0,0,0,0.1)] border-t border-orange-200 p-4">
        <audio ref={audioRef} src={episode.audioUrl} preload="metadata" />
        <div className="container mx-auto max-w-5xl flex items-center space-x-4">
            <img src={episode.imageUrl} alt={episode.title} className="w-16 h-16 rounded-md object-cover flex-shrink-0" />

            <div className="flex-1 min-w-0">
                <p className="font-bold text-orange-700 truncate">{episode.title}</p>
                <div className="flex items-center space-x-2 text-sm text-gray-600 mt-1">
                    <span>{formatTime(currentTime)}</span>
                    <input
                        type="range"
                        value={currentTime}
                        step="1"
                        min="0"
                        max={duration ? duration : 0}
                        onChange={(e) => onScrub(e.target.value)}
                        className="w-full h-1 bg-orange-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
                    />
                    <span>{duration ? formatTime(duration) : '0:00'}</span>
                </div>
            </div>

            <div className="flex items-center space-x-1 sm:space-x-2 text-orange-600">
                <button onClick={onPrev} className="p-2 rounded-full hover:bg-orange-100 transition-colors" aria-label="Previous episode"><PrevIcon className="w-6 h-6" /></button>
                <button onClick={() => handleSkip(-10)} className="p-2 rounded-full hover:bg-orange-100 transition-colors hidden sm:block" aria-label="Rewind 10 seconds"><RewindIcon className="w-5 h-5" /></button>
                <button onClick={togglePlayPause} className="p-3 bg-orange-500 text-white rounded-full shadow-lg hover:bg-orange-600 transition-transform transform hover:scale-105" aria-label={isPlaying ? 'Pause' : 'Play'}>
                    {isPlaying ? <PauseIcon className="w-6 h-6" /> : <PlayIcon className="w-6 h-6" />}
                </button>
                <button onClick={() => handleSkip(10)} className="p-2 rounded-full hover:bg-orange-100 transition-colors hidden sm:block" aria-label="Forward 10 seconds"><ForwardIcon className="w-5 h-5" /></button>
                <button onClick={onNext} className="p-2 rounded-full hover:bg-orange-100 transition-colors" aria-label="Next episode"><NextIcon className="w-6 h-6" /></button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Player;