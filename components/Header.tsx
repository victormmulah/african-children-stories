
import React from 'react';
import type { Podcast } from '../types';

interface HeaderProps {
  podcast: Podcast;
}

// A fallback logo component mimicking the original logo's style
const FallbackLogo: React.FC = () => (
    <div className="relative w-48 h-48 flex items-center justify-center bg-orange-400 rounded-lg shadow-lg">
        <span className="text-9xl font-extrabold text-white" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.3)' }}>A</span>
    </div>
);


const Header: React.FC<HeaderProps> = ({ podcast }) => {
  return (
    <header className="flex flex-col md:flex-row items-center md:items-start text-center md:text-left bg-white p-6 rounded-2xl shadow-lg border border-orange-200">
      <div className="flex-shrink-0 mb-6 md:mb-0 md:mr-8">
        {podcast.imageUrl ? (
          <img 
            src={podcast.imageUrl} 
            alt={podcast.title} 
            className="w-48 h-48 rounded-lg object-cover shadow-md"
            onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const fallback = document.getElementById('fallback-logo');
                if (fallback) fallback.style.display = 'flex';
            }}
          />
        ) : <FallbackLogo /> }
         <div id="fallback-logo" style={{ display: 'none' }}><FallbackLogo /></div>
      </div>
      <div className="flex flex-col justify-center">
        <h1 className="text-4xl md:text-5xl font-extrabold text-orange-600 tracking-tight">{podcast.title}</h1>
        <p className="mt-4 text-gray-600 max-w-2xl">{podcast.description}</p>
        <a href={podcast.link} target="_blank" rel="noopener noreferrer" className="mt-4 text-orange-500 hover:text-orange-700 font-semibold transition-colors duration-200">
          Visit Website &rarr;
        </a>
      </div>
    </header>
  );
};

export default Header;
