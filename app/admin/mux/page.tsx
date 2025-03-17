'use client';

import { useEffect, useState } from 'react';
import { VideoList } from '@/components/mux/VideoList';
import { VideoStats } from '@/components/mux/VideoStats';
import { useToast } from '@/components/ui/use-toast';

interface Video {
  id: string;
  asset_id: string;
  playback_id: string;
  title: string;
  status: string;
  duration: number;
  created_at: string;
  thumbnail_url?: string;
}

export default function MuxDashboard() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchVideos = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/mux/videos');
      if (!response.ok) throw new Error('Falha ao carregar vídeos');
      const data = await response.json();
      setVideos(data);
    } catch (error) {
      console.error('Erro ao carregar vídeos:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os vídeos',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/mux/videos/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Falha ao excluir vídeo');

      setVideos(prev => prev.filter(video => video.id !== id));
      toast({
        title: 'Sucesso',
        description: 'Vídeo excluído com sucesso',
      });
    } catch (error) {
      console.error('Erro ao excluir vídeo:', error);
      throw error; // Propagar o erro para o componente VideoList
    }
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  // Calcular estatísticas
  const stats = {
    totalVideos: videos.length,
    totalDuration: videos.reduce((acc, video) => acc + video.duration, 0),
    readyVideos: videos.filter(v => v.status.toLowerCase() === 'ready').length,
    erroredVideos: videos.filter(v => v.status.toLowerCase() === 'errored').length,
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="animate-pulse space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded-lg" />
            ))}
          </div>
          <div className="h-96 bg-muted rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Gerenciador de Vídeos</h1>
      <VideoStats {...stats} />
      <VideoList
        videos={videos}
        onDelete={handleDelete}
        onRefresh={fetchVideos}
      />
    </div>
  );
}
