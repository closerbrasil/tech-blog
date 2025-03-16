'use client';

import { useEffect, useRef, useState } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, SkipBack, SkipForward } from 'lucide-react';

interface MuxPlayerProps {
  videoId: string;
  title: string;
  poster?: string;
  className?: string;
}

export default function MuxPlayer({ videoId, title, poster, className = '' }: MuxPlayerProps) {
  const videoRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Função para formatar o tempo em minutos:segundos
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  // Função para lidar com mensagens do iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Verificar se a mensagem é do player Mux
      if (event.data && typeof event.data === 'object' && event.data.type) {
        switch (event.data.type) {
          case 'ready':
            setIsLoading(false);
            break;
          case 'playing':
            setIsPlaying(true);
            break;
          case 'pause':
            setIsPlaying(false);
            break;
          case 'timeupdate':
            if (event.data.currentTime) {
              setCurrentTime(event.data.currentTime);
            }
            break;
          case 'durationchange':
            if (event.data.duration) {
              setDuration(event.data.duration);
            }
            break;
          case 'error':
            setError('Erro ao carregar o vídeo');
            setIsLoading(false);
            break;
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  // Função para enviar comandos para o iframe
  const sendCommand = (command: string, value?: any) => {
    if (videoRef.current && videoRef.current.contentWindow) {
      const message = { type: command };
      if (value !== undefined) {
        Object.assign(message, { value });
      }
      videoRef.current.contentWindow.postMessage(message, '*');
    }
  };

  // Funções de controle do player
  const togglePlay = () => {
    if (isPlaying) {
      sendCommand('pause');
    } else {
      sendCommand('play');
    }
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    sendCommand('muted', !isMuted);
    setIsMuted(!isMuted);
  };

  const seekTo = (time: number) => {
    sendCommand('seekTo', time);
    setCurrentTime(time);
  };

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    seekTo(time);
  };

  const enterFullscreen = () => {
    if (containerRef.current) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      }
    }
  };

  return (
    <div 
      ref={containerRef}
      className={`relative overflow-hidden rounded-lg bg-black ${className}`}
      data-video-id={videoId}
    >
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-10">
          <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
      
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75 z-10">
          <div className="text-white text-center p-4">
            <p className="text-xl font-bold mb-2">Erro</p>
            <p>{error}</p>
            <p className="mt-2 text-sm">{videoId && `ID do vídeo: ${videoId}`}</p>
          </div>
        </div>
      )}

      <div className="aspect-video w-full">
        <iframe
          ref={videoRef}
          src={`https://iframe.mediadelivery.net/embed/${videoId}?autoplay=false&muted=${isMuted}`}
          className="w-full h-full"
          title={title}
          allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
          allowFullScreen
          loading="lazy"
        />
      </div>

      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
        <div className="flex flex-col space-y-2">
          <div className="w-full">
            <input
              type="range"
              min="0"
              max={duration || 100}
              value={currentTime}
              onChange={handleProgressChange}
              className="w-full h-1 bg-gray-600 rounded-full appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, white ${(currentTime / (duration || 1)) * 100}%, gray ${(currentTime / (duration || 1)) * 100}%)`,
              }}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={togglePlay}
                className="text-white hover:text-blue-400 transition-colors"
                aria-label={isPlaying ? "Pausar" : "Reproduzir"}
              >
                {isPlaying ? <Pause size={24} /> : <Play size={24} />}
              </button>
              
              <button
                onClick={toggleMute}
                className="text-white hover:text-blue-400 transition-colors"
                aria-label={isMuted ? "Ativar som" : "Desativar som"}
              >
                {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
              </button>
              
              <div className="text-white text-sm">
                {formatTime(currentTime)} / {formatTime(duration)}
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={enterFullscreen}
                className="text-white hover:text-blue-400 transition-colors"
                aria-label="Tela cheia"
              >
                <Maximize size={24} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 