'use client';

import dynamic from 'next/dynamic';
import { useRef } from 'react';

const MuxPlayer = dynamic(
  () => import('@mux/mux-player-react').then((mod) => mod.default),
  { ssr: false }
);

interface VideoPlayerProps {
  videoId: string;
  title: string;
  poster?: string;
}

export default function VideoPlayer({ videoId, title, poster }: VideoPlayerProps) {
  const playerRef = useRef(null);

  return (
    <MuxPlayer
      ref={playerRef}
      streamType="on-demand"
      playbackId={videoId}
      metadata={{
        video_id: videoId,
        video_title: title,
        viewer_user_id: 'anonymous'
      }}
      poster={poster}
      autoPlay={false}
      muted={false}
      accentColor="#3b82f6"
      className="w-full aspect-video rounded-xl overflow-hidden"
    />
  );
} 