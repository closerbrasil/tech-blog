'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Copy, MoreVertical, Trash2, ExternalLink } from 'lucide-react';

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

interface VideoListProps {
  videos: Video[];
  onDelete?: (id: string) => void;
  onRefresh?: () => void;
}

export function VideoList({ videos, onDelete, onRefresh }: VideoListProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState<string | null>(null);

  const handleCopy = (text: string, description: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copiado!',
      description: `${description} copiado para a área de transferência`,
    });
  };

  const handleDelete = async (id: string) => {
    if (!onDelete) return;
    
    try {
      setLoading(id);
      await onDelete(id);
      toast({
        title: 'Sucesso',
        description: 'Vídeo excluído com sucesso',
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao excluir o vídeo',
        variant: 'destructive',
      });
    } finally {
      setLoading(null);
    }
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    const parts = [];
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (remainingSeconds > 0 || parts.length === 0) parts.push(`${remainingSeconds}s`);

    return parts.join(' ');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'ready':
        return 'bg-green-500';
      case 'preparing':
        return 'bg-yellow-500';
      case 'errored':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Vídeos</CardTitle>
        {onRefresh && (
          <Button variant="outline" onClick={onRefresh}>
            Atualizar
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Duração</TableHead>
                <TableHead>Criado em</TableHead>
                <TableHead className="w-[80px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {videos.map((video) => (
                <TableRow key={video.id}>
                  <TableCell className="font-medium">{video.title}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={getStatusColor(video.status)}>
                      {video.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDuration(video.duration)}</TableCell>
                  <TableCell>{formatDate(video.created_at)}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => handleCopy(video.asset_id, 'Asset ID')}
                        >
                          <Copy className="mr-2 h-4 w-4" />
                          Copiar Asset ID
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleCopy(video.playback_id, 'Playback ID')}
                        >
                          <Copy className="mr-2 h-4 w-4" />
                          Copiar Playback ID
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => window.open(`https://dashboard.mux.com/organizations/video/environments/production/assets/${video.asset_id}`, '_blank')}
                        >
                          <ExternalLink className="mr-2 h-4 w-4" />
                          Ver no Mux
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(video.id)}
                          className="text-red-600"
                          disabled={loading === video.id}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          {loading === video.id ? 'Excluindo...' : 'Excluir'}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {videos.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    Nenhum vídeo encontrado
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
} 