import React from 'react';
import { Episode } from '../types';

interface GlassPlayerProps {
  episode: Episode;
  seriesTitle: string;
  onNext?: () => void;
  onPrev?: () => void;
  hasNext: boolean;
  hasPrev: boolean;
  initialProgress?: number;
  onProgressUpdate?: (seconds: number) => void;
}

export default function GlassPlayer({
  episode,
  seriesTitle
}: GlassPlayerProps) {

  // Convert Dailymotion typical player links to embed links safely
  const getEmbedUrl = (rawUrl: string) => {
    if (!rawUrl) return 'https://www.dailymotion.com/embed/video/x8nc8t7';
    let url = rawUrl.trim();

    // If they pasted an <iframe> HTML embed code, parse out the src attribute
    if (url.startsWith('<') && (url.includes('src=') || url.includes('SRC='))) {
      const srcMatch = url.match(/src=["']([^"']+)["']/i);
      if (srcMatch && srcMatch[1]) {
        url = srcMatch[1];
      }
    }

    // Now check if it's already an embed URL
    if (url.includes('embed')) {
      return url;
    }

    // Match short URLs like https://dai.ly/x8nc8t7
    const shortMatch = url.match(/dai\.ly\/([a-zA-Z0-9]+)/i);
    if (shortMatch && shortMatch[1]) {
      return `https://www.dailymotion.com/embed/video/${shortMatch[1]}?autoplay=1`;
    }

    // Match typical video path: dailymotion.com/video/x8nc8t7 or similar
    const normalMatch = url.match(/video\/([a-zA-Z0-9]+)/i);
    if (normalMatch && normalMatch[1]) {
      return `https://www.dailymotion.com/embed/video/${normalMatch[1]}?autoplay=1`;
    }

    // If they just pasted a plain ID code like x8vszka
    if (/^[a-zA-Z0-9_-]{5,12}$/.test(url)) {
      return `https://www.dailymotion.com/embed/video/${url}?autoplay=1`;
    }

    return url;
  };

  const embedUrl = getEmbedUrl(episode.videoUrl || '');

  return (
    <div
      id={`glass-video-viewport-${episode.id}`}
      className="relative w-full aspect-video rounded-3xl overflow-hidden bg-black border border-white/10 shadow-2xl"
    >
      <iframe
        src={embedUrl}
        className="w-full h-full border-0 absolute inset-0"
        allow="autoplay; fullscreen; picture-in-picture"
        allowFullScreen
        title={episode.title}
      />
    </div>
  );
}
