'use client';

import { useState, useEffect } from 'react';
import MuxPlayer from '@mux/mux-player-react';

interface VideoPlayerProps {
  videoId: string;
  title: string;
  poster?: string;
}

export default function VideoPlayer({ videoId, title, poster }: VideoPlayerProps) {
  return (
    <MuxPlayer
      streamType="on-demand"
      playbackId={videoId}
      metadata={{
        video_title: title,
        player_name: "Tech Blog Player",
      }}
      poster={poster}
      thumbnailTime={0}
      primaryColor="#64748b"
      secondaryColor="#334155"
      className="w-full aspect-video rounded-xl overflow-hidden"
    />
  );
} 