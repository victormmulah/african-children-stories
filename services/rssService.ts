import type { Podcast, Episode } from '../types';

// Helper to safely get text content from an XML element
const getElementText = (element: Element, query: string): string => {
  const node = element.querySelector(query);
  return node?.textContent || '';
};

const getElementAttribute = (element: Element, query: string, attribute: string): string => {
    const node = element.querySelector(query);
    return node?.getAttribute(attribute) || '';
}

// Helper to format duration from seconds to MM:SS
const formatDuration = (durationStr: string): string => {
  if (!durationStr) return 'N/A';
  const parts = durationStr.split(':').map(Number);
  if (parts.length === 3) { // HH:MM:SS
    const [h, m, s] = parts;
    return `${h * 60 + m}:${s.toString().padStart(2, '0')}`;
  }
  if (parts.length === 2) { // MM:SS
    return durationStr;
  }
  if (parts.length === 1) { // seconds
    const totalSeconds = parts[0];
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
  return durationStr; // Fallback
};

export const fetchPodcast = async (feedUrl: string): Promise<{ podcast: Podcast, episodes: Episode[] }> => {
  // Using a CORS proxy to bypass browser restrictions
  const PROXY_URL = 'https://corsproxy.io/?';
  const response = await fetch(`${PROXY_URL}${encodeURIComponent(feedUrl)}`);
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const str = await response.text();
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(str, 'application/xml');

  const errorNode = xmlDoc.querySelector('parsererror');
  if (errorNode) {
    throw new Error('Failed to parse XML');
  }

  const channel = xmlDoc.querySelector('channel');
  if (!channel) {
    throw new Error('Could not find channel in RSS feed');
  }

  const podcast: Podcast = {
    title: getElementText(channel, 'title'),
    description: getElementText(channel, 'description'),
    imageUrl: getElementAttribute(channel, 'itunes\\:image, image', 'href') || getElementText(channel, 'image > url'),
    link: getElementText(channel, 'link'),
  };

  const episodes: Episode[] = Array.from(xmlDoc.querySelectorAll('item')).map(item => {
    const descriptionHtml = getElementText(item, 'description');
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = descriptionHtml;
    const descriptionText = tempDiv.textContent || tempDiv.innerText || "";


    return {
      title: getElementText(item, 'title'),
      description: descriptionText.trim(),
      pubDate: new Date(getElementText(item, 'pubDate')).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
      audioUrl: getElementAttribute(item, 'enclosure', 'url'),
      duration: formatDuration(getElementText(item, 'itunes\\:duration')),
      imageUrl: getElementAttribute(item, 'itunes\\:image, image', 'href') || getElementText(item, 'image > url') || podcast.imageUrl,
    };
  });

  return { podcast, episodes };
};