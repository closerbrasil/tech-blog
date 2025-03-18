'use client';

import React from 'react';
import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
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
import { Copy, Trash2, ExternalLink, Search, ArrowUpDown, Clock, Calendar, Check, ChevronLeft, ChevronRight } from 'lucide-react';

interface Video {
  id: string;
  asset_id: string;
  playback_id: string;
  title: string;
  status: string;
  duration: number;
  created_at: string;
  thumbnail_url?: string;
  views?: number;
}

interface VideoListProps {
  videos: Video[];
  onDelete?: (id: string) => void;
  onRefresh?: () => void;
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  itemsPerPage?: number;
  totalItems?: number;
}

type SortField = 'title' | 'duration' | 'created_at' | 'views';
type SortOrder = 'asc' | 'desc';

export function VideoList({ 
  videos, 
  onDelete, 
  onRefresh,
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  itemsPerPage = 10,
  totalItems = 0
}: VideoListProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [copiedFields, setCopiedFields] = useState<{ [key: string]: boolean }>({});
  const [selectedVideos, setSelectedVideos] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);

  // Filtrar e ordenar vídeos
  const filteredVideos = useMemo(() => {
    let result = [...videos];
    
    // Aplicar filtro de busca
    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(video => 
        video.title.toLowerCase().includes(searchLower) ||
        video.status.toLowerCase().includes(searchLower)
      );
    }

    // Aplicar ordenação
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'duration':
          comparison = a.duration - b.duration;
          break;
        case 'created_at':
          comparison = new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          break;
        case 'views':
          comparison = (a.views || 0) - (b.views || 0);
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [videos, search, sortField, sortOrder]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const handleCopy = async (text: string, description: string, fieldId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedFields(prev => ({ ...prev, [fieldId]: true }));
      toast({
        title: 'Copiado!',
        description: `${description} copiado para a área de transferência`,
      });
      
      // Reset do estado após 2 segundos
      setTimeout(() => {
        setCopiedFields(prev => ({ ...prev, [fieldId]: false }));
      }, 2000);
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível copiar o texto',
        variant: 'destructive',
      });
    }
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
    try {
      return new Date(dateString).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (error) {
      return 'Data inválida';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'ready':
        return 'bg-green-500 hover:bg-green-600';
      case 'preparing':
        return 'bg-yellow-500 hover:bg-yellow-600';
      case 'errored':
        return 'bg-red-500 hover:bg-red-600';
      default:
        return 'bg-gray-500 hover:bg-gray-600';
    }
  };

  const SortButton = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <Button
      variant="ghost"
      size="sm"
      className="h-8 flex items-center gap-1 hover:bg-accent"
      onClick={() => handleSort(field)}
    >
      {children}
      <ArrowUpDown className="h-4 w-4" />
    </Button>
  );

  const handleSelectAll = (checked: boolean | "indeterminate") => {
    if (checked === true) {
      setSelectedVideos(new Set(filteredVideos.map(video => video.id)));
    } else {
      setSelectedVideos(new Set());
    }
  };

  const handleSelectVideo = (videoId: string, checked: boolean | "indeterminate") => {
    const newSelected = new Set(selectedVideos);
    if (checked === true) {
      newSelected.add(videoId);
    } else {
      newSelected.delete(videoId);
    }
    setSelectedVideos(newSelected);
  };

  const handleBulkDelete = async () => {
    if (!onDelete || selectedVideos.size === 0) return;

    try {
      setIsDeleting(true);
      const deletePromises = Array.from(selectedVideos).map(id => onDelete(id));
      await Promise.all(deletePromises);
      
      toast({
        title: 'Sucesso',
        description: `${selectedVideos.size} vídeos excluídos com sucesso`,
      });
      setSelectedVideos(new Set());
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao excluir os vídeos',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Card className="h-full flex flex-col max-w-[100%] overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between flex-none space-y-0 pb-4 px-6">
        <CardTitle className="text-xl">Vídeos</CardTitle>
        <div className="flex items-center gap-2">
          {selectedVideos.size > 0 && (
            <div className="flex items-center gap-2 mr-4">
              <span className="text-sm text-muted-foreground">
                {selectedVideos.size} selecionados
              </span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleBulkDelete}
                      disabled={isDeleting}
                      className="text-white"
                    >
                      {isDeleting ? (
                        <Clock className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Trash2 className="h-4 w-4 mr-2" />
                      )}
                      Excluir selecionados
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Excluir todos os vídeos selecionados</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          )}
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
      <CardContent className="flex-1 p-0 min-h-0">
        <div className="h-full flex flex-col rounded-md border">
          <div className="flex-1 overflow-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-background z-10">
                <TableRow>
                  <TableHead className="w-[40px] pl-4 pr-0">
                    <div className="flex items-center h-[52px]">
                      <Checkbox
                        checked={selectedVideos.size === filteredVideos.length && filteredVideos.length > 0}
                        onCheckedChange={handleSelectAll}
                        aria-label="Selecionar todos os vídeos"
                        className="h-4 w-4 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                      />
                    </div>
                  </TableHead>
                  <TableHead className="w-[45%] pl-4">
                    <div className="flex items-center">
                      <SortButton field="title">Título</SortButton>
                    </div>
                  </TableHead>
                  <TableHead className="w-[10%]">
                    <div className="flex justify-center">
                      Status
                    </div>
                  </TableHead>
                  <TableHead className="w-[10%]">
                    <div className="flex justify-center">
                      <SortButton field="duration">
                        <Clock className="h-4 w-4 mr-1 inline" />
                        Duração
                      </SortButton>
                    </div>
                  </TableHead>
                  <TableHead className="w-[15%]">
                    <div className="flex justify-center">
                      <SortButton field="created_at">
                        <Calendar className="h-4 w-4 mr-1 inline" />
                        Criado em
                      </SortButton>
                    </div>
                  </TableHead>
                  <TableHead className="w-[20%] pl-6">
                    <div className="flex justify-start pl-2">
                      Ações
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVideos.map((video) => (
                  <TableRow key={video.id} className="h-[52px]">
                    <TableCell className="w-[40px] pl-4 pr-0">
                      <div className="flex items-center h-full">
                        <Checkbox
                          checked={selectedVideos.has(video.id)}
                          onCheckedChange={(checked) => handleSelectVideo(video.id, checked)}
                          aria-label={`Selecionar vídeo ${video.title}`}
                          className="h-4 w-4 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                        />
                      </div>
                    </TableCell>
                    <TableCell className="w-[45%] pl-4">
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
                        <span className="truncate">{video.title}</span>
                      </div>
                    </TableCell>
                    <TableCell className="w-[10%] px-0">
                      <div className="flex justify-center">
                        <Badge 
                          variant={video.status === "ready" ? "secondary" : "default"} 
                          className={video.status === "ready" ? "bg-green-500/10 text-green-500 hover:bg-green-500/20" : ""}
                        >
                          {video.status}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="w-[10%] px-0">
                      <div className="flex justify-center">
                        {formatDuration(video.duration)}
                      </div>
                    </TableCell>
                    <TableCell className="w-[15%] px-0">
                      <div className="flex justify-center">
                        {formatDate(video.created_at)}
                      </div>
                    </TableCell>
                    <TableCell className="w-[20%] pl-6">
                      <div className="flex items-center gap-2">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => window.open(`https://dashboard.mux.com/organizations/video/environments/production/assets/${video.asset_id}`, '_blank')}
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Ver no Mux</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleCopy(video.asset_id, 'Asset ID', `asset_${video.id}`)}
                                className={copiedFields[`asset_${video.id}`] ? 'text-green-500' : ''}
                              >
                                {copiedFields[`asset_${video.id}`] ? (
                                  <Check className="h-4 w-4" />
                                ) : (
                                  <Copy className="h-4 w-4" />
                                )}
                                <span className="sr-only">Copiar Asset ID</span>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{copiedFields[`asset_${video.id}`] ? 'Copiado!' : 'Copiar Asset ID'}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleCopy(video.playback_id, 'Playback ID', `playback_${video.id}`)}
                                className={copiedFields[`playback_${video.id}`] ? 'text-green-500' : ''}
                              >
                                {copiedFields[`playback_${video.id}`] ? (
                                  <Check className="h-4 w-4" />
                                ) : (
                                  <Copy className="h-4 w-4" />
                                )}
                                <span className="sr-only">Copiar Playback ID</span>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{copiedFields[`playback_${video.id}`] ? 'Copiado!' : 'Copiar Playback ID'}</p>
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
                                disabled={loading === video.id}
                                className="text-red-600 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900/20"
                              >
                                {loading === video.id ? (
                                  <Clock className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                                <span className="sr-only">Excluir vídeo</span>
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
                {filteredVideos.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                      Nenhum vídeo encontrado
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <div className="flex-none border-t bg-background">
            <div className="flex items-center justify-between px-6 py-3">
              <div className="text-sm text-muted-foreground flex items-center gap-1">
                <span>
                  Exibindo {Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)}-
                  {Math.min(currentPage * itemsPerPage, totalItems)}
                </span>
                <span>de</span>
                <span>{totalItems}</span>
                <span>itens</span>
              </div>
              {totalPages > 1 && (
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange?.(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="h-8 px-2"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(page => {
                      // Mostrar primeira página, última página, página atual e páginas adjacentes
                      return (
                        page === 1 ||
                        page === totalPages ||
                        Math.abs(page - currentPage) <= 1
                      );
                    })
                    .map((page, index, array) => (
                      <React.Fragment key={page}>
                        {index > 0 && array[index - 1] !== page - 1 && (
                          <span className="text-muted-foreground px-1">...</span>
                        )}
                        <Button
                          variant={currentPage === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => onPageChange?.(page)}
                          className="h-8 min-w-[2rem] px-2"
                        >
                          {page}
                        </Button>
                      </React.Fragment>
                    ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange?.(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="h-8 px-2"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 