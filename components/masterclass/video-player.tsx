"use client";
import { useState } from "react";
import { Play } from "lucide-react";

interface VideoPlayerProps {
  vimeoId: string;
  title: string;
  thumbnailUrl?: string | null;
}

export function VideoPlayer({ vimeoId, title, thumbnailUrl }: VideoPlayerProps) {
  const [playing, setPlaying] = useState(false);

  if (playing) {
    return (
      <div className="relative w-full rounded-2xl overflow-hidden bg-black" style={{ paddingTop: "56.25%" }}>
        <iframe
          className="absolute inset-0 w-full h-full"
          src={`https://player.vimeo.com/video/${vimeoId}?autoplay=1&color=C9A84C&title=0&byline=0&portrait=0`}
          title={title}
          frameBorder="0"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <button
      onClick={() => setPlaying(true)}
      className="relative w-full rounded-2xl overflow-hidden bg-surface-2 group cursor-pointer"
      style={{ paddingTop: "56.25%" }}
      aria-label={`Play ${title}`}
    >
      {/* Thumbnail */}
      {thumbnailUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={thumbnailUrl}
          alt={title}
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-surface to-surface-2" />
      )}

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors" />

      {/* Play button */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-20 h-20 rounded-full bg-brand/90 flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform">
          <Play size={32} className="text-background ml-2" />
        </div>
      </div>

      {/* Label */}
      <div className="absolute bottom-5 left-5">
        <p className="text-xs font-semibold text-white/70 uppercase tracking-widest">
          Click to play
        </p>
      </div>
    </button>
  );
}
