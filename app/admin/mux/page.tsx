'use client';

import { useEffect, useState } from 'react';
import { VideoList } from '@/components/admin/mux/VideoList';
import { VideoStats } from '@/components/admin/mux/VideoStats';
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

// Aumentando o número de itens por página após otimizações de layout
const ITEMS_PER_PAGE = 8;

export default function MuxDashboard() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
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
      throw error;
    }
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  // Calcular estatísticas usando todos os vídeos
  const stats = {
    totalVideos: videos.length,
    totalDuration: videos.reduce((acc, video) => acc + video.duration, 0),
    readyVideos: videos.filter(v => v.status.toLowerCase() === 'ready').length,
    erroredVideos: videos.filter(v => v.status.toLowerCase() === 'errored').length,
  };

  // Calcular paginação
  const totalPages = Math.ceil(videos.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedVideos = videos.slice(startIndex, endIndex);

  if (loading) {
    return (
      <div className="h-[calc(100vh-4rem)] flex flex-col overflow-hidden">
        <div className="flex-1 p-3 flex flex-col overflow-hidden">
          <div className="animate-pulse space-y-3 flex-none">
            <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-20 bg-muted rounded-lg" />
              ))}
            </div>
          </div>
          <div className="flex-1 mt-3 bg-muted rounded-lg min-h-0" />
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col overflow-hidden">
      <div className="flex-1 p-3 flex flex-col overflow-hidden">
        {/* Header Section - Altura fixa */}
        <div className="flex-none">
          <h1 className="text-xl font-semibold tracking-tight mb-2">Gerenciador de Vídeos</h1>
          <VideoStats {...stats} />
        </div>
        
        {/* Main Content - Altura flexível */}
        <div className="flex-1 mt-3 min-h-0">
          <VideoList
            videos={paginatedVideos}
            onDelete={handleDelete}
            onRefresh={fetchVideos}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            itemsPerPage={ITEMS_PER_PAGE}
            totalItems={videos.length}
          />
        </div>
      </div>
    </div>
  );
}
