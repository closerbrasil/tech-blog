'use client';

import React from 'react';
import { useState, useEffect } from 'react';
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
import { Search, ArrowUpDown, Clock, Calendar, ExternalLink, Trash2 } from 'lucide-react';

interface Video {
  id: string;
  title: string;
  status: string;
  duration: number;
  created_at: string;
  thumbnail_url?: string;
  url: string;
  views?: number;
  categories: {
    id: string;
    nome: string;
    cor?: string;
  }[];
}

interface VideoTableProps {
  onRefresh?: () => void;
}

export function VideoTable({ onRefresh }: VideoTableProps) {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage] = useState(10);
  const { toast } = useToast();

  const fetchVideos = async (page: number = 1) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/videos?page=${page}&limit=${itemsPerPage}&search=${search}`);
      if (!response.ok) {
        throw new Error('Erro ao buscar vídeos');
      }
      const data = await response.json();
      setVideos(data.items);
      setTotalPages(data.totalPages);
      setTotalItems(data.totalItems);
      setCurrentPage(page);
    } catch (error) {
      console.error('Erro ao buscar vídeos:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os vídeos',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, [search]);

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/videos/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Erro ao excluir vídeo');
      }

      toast({
        title: 'Sucesso',
        description: 'Vídeo excluído com sucesso',
      });

      fetchVideos(currentPage);
    } catch (error) {
      console.error('Erro ao excluir vídeo:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir o vídeo',
        variant: 'destructive',
      });
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

  return (
    <Card className="mt-8">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-xl">Vídeos</CardTitle>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar vídeos..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 w-[250px]"
            />
          </div>
          {onRefresh && (
            <Button variant="outline" onClick={onRefresh}>
              Atualizar
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[45%]">
                  <Button variant="ghost" className="flex items-center gap-1">
                    Título
                    <ArrowUpDown className="h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead className="w-[15%] text-center">Status</TableHead>
                <TableHead className="w-[10%] text-center">
                  <Button variant="ghost" className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    Duração
                  </Button>
                </TableHead>
                <TableHead className="w-[15%] text-center">
                  <Button variant="ghost" className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Criado em
                  </Button>
                </TableHead>
                <TableHead className="w-[15%] pl-6">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {videos.map((video) => (
                <TableRow key={video.id}>
                  <TableCell className="w-[45%]">
                    <div className="flex items-center gap-3">
                      {video.thumbnail_url && (
                        <div className="w-[120px] h-[35px] flex-shrink-0 overflow-hidden rounded">
                          <img
                            src={video.thumbnail_url}
                            alt={video.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="flex flex-col">
                        <span className="truncate font-medium">{video.title}</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {video.categories.map((category) => (
                            <Badge
                              key={category.id}
                              variant="secondary"
                              style={category.cor ? {
                                backgroundColor: `${category.cor}20`,
                                color: category.cor,
                                borderColor: category.cor
                              } : undefined}
                              className="text-xs"
                            >
                              {category.nome}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="w-[15%]">
                    <div className="flex justify-center">
                      <Badge 
                        variant={video.status === "ready" ? "secondary" : "default"}
                        className={video.status === "ready" ? "bg-green-500/10 text-green-500 hover:bg-green-500/20" : ""}
                      >
                        {video.status}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="w-[10%]">
                    <div className="flex justify-center">
                      {formatDuration(video.duration)}
                    </div>
                  </TableCell>
                  <TableCell className="w-[15%]">
                    <div className="flex justify-center">
                      {formatDate(video.created_at)}
                    </div>
                  </TableCell>
                  <TableCell className="w-[15%] pl-6">
                    <div className="flex items-center gap-2">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => window.open(video.url, '_blank')}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Ver vídeo</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(video.id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900/20"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Excluir vídeo</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {videos.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
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