"use client";

import React from "react";
import { Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";

interface VideoCardProps {
  id: string;
  slug: string;
  title: string;
  description: string;
  views: number;
  thumbnail: string;
  className?: string;
}

export function RelatedVideos({
  videos,
  title = "Continue Lendo",
  className,
}: {
  videos: VideoCardProps[];
  title?: string;
  className?: string;
}) {
  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-center gap-2 mb-6">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 4L10.6 5.4L16.2 11H4V13H16.2L10.6 18.6L12 20L20 12L12 4Z" fill="currentColor"/>
        </svg>
        <h2 className="text-xl font-bold text-foreground">{title}</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {videos.slice(0, 3).map((video) => (
          <VideoCard key={video.id} {...video} />
        ))}
      </div>
    </div>
  );
}

function VideoCard({
  title,
  description,
  views,
  thumbnail,
  slug,
  className,
}: VideoCardProps) {
  return (
    <Link href={`/videos/${slug}`}>
      <div
        className={cn(
          "group flex flex-col rounded-lg overflow-hidden hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200",
          className
        )}
      >
        <div className="relative aspect-video overflow-hidden rounded-lg">
          <Image
            src={thumbnail}
            alt={title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>
        <div className="p-4">
          <h3 className="font-medium text-foreground line-clamp-1 mb-2">{title}</h3>
          <p className="text-sm text-foreground/60 line-clamp-2 mb-3">{description}</p>
          <div className="flex items-center text-xs text-foreground/50">
            <Eye className="h-3 w-3 mr-1" />
            <span>{formatViews(views)} visualizações</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function formatViews(views: number): string {
  if (views >= 1000000) {
    return `${(views / 1000000).toFixed(1)}M`;
  } else if (views >= 1000) {
    return `${(views / 1000).toFixed(1)}K`;
  }
  return views.toString();
} 