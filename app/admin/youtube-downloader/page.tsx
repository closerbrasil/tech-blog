'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, X, ChevronRight, Loader2, Trash, RefreshCw, AlertCircle, CheckCircle2, Clock, PlayCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Category {
  id: string;
  nome: string;
  parent_id: string | null;
  slug: string;
  descricao?: string;
  imagem_url?: string;
  cor?: string;
  criado_em: string;
  atualizado_em: string;
  _indentLevel?: number; // Propriedade interna apenas para indentação visual
}

interface VideoQueueItem {
  id: string;
  youtube_url: string;
  processing_status: 'waiting' | 'downloading' | 'uploading' | 'completed' | 'error';
  error?: string;
  time_ago?: string;
  status_description?: string;
  is_processing?: boolean;
  titulo?: string;
  thumbnail_url?: string;
  url_video?: string;
}

export default function YouTubeDownloader() {
  const [url, setUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedAdditionalCategories, setSelectedAdditionalCategories] = useState<string[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [primaryCategory, setPrimaryCategory] = useState<Category | null>(null);
  const [showNewCategoryDialog, setShowNewCategoryDialog] = useState(false);
  const [videoPlayerOpen, setVideoPlayerOpen] = useState(false);
  const [currentVideoUrl, setCurrentVideoUrl] = useState<string | null>(null);
  const [currentVideoTitle, setCurrentVideoTitle] = useState<string | null>(null);
  const [newCategory, setNewCategory] = useState<{
    nome: string;
    descricao: string;
    parent_id: string | null;
  }>({
    nome: '',
    descricao: '',
    parent_id: null
  });
  const { toast } = useToast();

  const { data: queueData, refetch: refetchQueue } = useQuery({
    queryKey: ['video-queue'],
    queryFn: async () => {
      const response = await fetch('/api/admin/youtube-downloader/status');
      if (!response.ok) throw new Error('Erro ao carregar status dos vídeos');
      return response.json();
    },
    refetchInterval: 2000, // Atualiza a cada 2 segundos
  });

  const videoQueue = queueData?.videos || [];

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categorias');
        if (!response.ok) {
          throw new Error('Erro ao buscar categorias');
        }
        const data = await response.json();
        setCategories(data);
      } catch (error) {
        console.error('Erro ao buscar categorias:', error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar as categorias",
          variant: "destructive"
        });
      }
    };

    fetchCategories();
  }, [toast]);

  const processCategories = (categories: Category[]) => {
    // Primeiro, ordenamos as categorias para que os pais venham antes dos filhos
    const sortedCategories = [...categories].sort((a, b) => {
      if (a.parent_id === null && b.parent_id !== null) return -1;
      if (a.parent_id !== null && b.parent_id === null) return 1;
      return a.nome.localeCompare(b.nome);
    });

    // Calculamos o nível de cada categoria
    const categoryLevels = new Map<string, number>();
    sortedCategories.forEach(category => {
      if (category.parent_id === null) {
        categoryLevels.set(category.id, 0);
      } else {
        const parentLevel = categoryLevels.get(category.parent_id) ?? 0;
        categoryLevels.set(category.id, parentLevel + 1);
      }
    });

    // Retornamos as categorias com o nível calculado apenas para indentação visual
    return sortedCategories.map(category => {
      const level = categoryLevels.get(category.id) ?? 0;
      // Não adicionamos o level como propriedade do objeto, apenas retornamos para uso no CSS
      return {
        ...category,
        _indentLevel: level // Propriedade interna apenas para indentação visual
      };
    });
  };

  const renderCategories = () => {
    const processedCategories = processCategories(categories);

    return processedCategories.map((category) => {
      const indentLevel = category._indentLevel || 0;
      
      return (
        <SelectItem
          key={category.id}
          value={category.id}
          textValue={category.nome}
          data-display-name={category.nome}
          className={cn(
            "flex items-center gap-2",
            { "pl-[calc(24px*var(--level,0))]": indentLevel > 0 }
          )}
          style={{
            '--level': indentLevel
          } as React.CSSProperties}
        >
          <div className="flex items-center gap-2 truncate">
            {indentLevel > 0 && (
              <ChevronRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />
            )}
            <span className="truncate">{category.nome}</span>
            {category.cor && (
              <span 
                className="w-3 h-3 rounded-full inline-block flex-shrink-0"
                style={{ backgroundColor: category.cor }}
              />
            )}
          </div>
        </SelectItem>
      );
    });
  };

  const handleCreateCategory = async () => {
    if (!newCategory.nome.trim()) {
      toast({
        title: 'Erro',
        description: 'O nome da categoria é obrigatório',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await fetch('/api/categorias', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nome: newCategory.nome.trim(),
          parent_id: newCategory.parent_id,
          descricao: newCategory.descricao.trim(),
          slug: newCategory.nome.trim()
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^\w\s]/g, "")
            .replace(/\s+/g, "-"),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erro ao criar categoria');
      }

      setCategories(prev => [...prev, data]);
      
      setNewCategory({
        nome: '',
        descricao: '',
        parent_id: null
      });
      
      toast({
        title: 'Sucesso',
        description: 'Categoria criada com sucesso',
      });

      setShowNewCategoryDialog(false);
    } catch (error) {
      console.error('Erro ao criar categoria:', error);
      toast({
        title: 'Erro ao criar categoria',
        description: error instanceof Error ? error.message : 'Ocorreu um erro desconhecido',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Função para garantir que a categoria seja exibida corretamente
  const ensureCategoryDisplay = (category: Category) => {
    // Sobrescrever o método toString para garantir que apenas o nome seja exibido
    return {
      ...category,
      toString: () => category.nome
    };
  };

  const handleSetPrimaryCategory = (category: Category) => {
    // Garantir que a categoria seja exibida corretamente
    const safeCategory = ensureCategoryDisplay(category);
    setPrimaryCategory(safeCategory);
    if (!selectedAdditionalCategories.some(sc => sc === safeCategory.id)) {
      setSelectedAdditionalCategories(prev => [...prev, safeCategory.id]);
    }
  };

  const handleCategorySelect = (category: Category) => {
    // Garantir que a categoria seja exibida corretamente
    const safeCategory = ensureCategoryDisplay(category);
    if (!selectedAdditionalCategories.some(sc => sc === safeCategory.id)) {
      setSelectedAdditionalCategories(prev => [...prev, safeCategory.id]);
    }
  };

  const handleRemoveCategory = (categoryId: string) => {
    setSelectedAdditionalCategories(prev => prev.filter(id => id !== categoryId));
    if (primaryCategory?.id === categoryId) {
      setPrimaryCategory(null);
    }
  };

  const addToQueue = async (url: string) => {
    if (!url.trim()) {
      toast({
        title: 'Erro',
        description: 'A URL do vídeo é obrigatória',
        variant: 'destructive',
      });
      return;
    }

    if (!primaryCategory) {
      toast({
        title: 'Erro',
        description: 'A categoria principal é obrigatória',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/admin/youtube-downloader', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: url.trim(),
          category_id: primaryCategory.id,
          additional_categories: selectedAdditionalCategories
            .filter(sc => sc !== primaryCategory.id)
            .map(sc => sc)
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 409 && data.existingUrl) {
          toast({
            title: 'Vídeo já existe',
            description: (
              <div className="mt-2">
                <p>{data.error}</p>
                <a 
                  href={data.existingUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline mt-2 inline-block"
                >
                  Clique aqui para ver o vídeo existente
                </a>
              </div>
            ),
            variant: 'warning',
          });
          setUrl('');
          return;
        }
        throw new Error(data.error || 'Erro ao processar vídeo');
      }

      setUrl('');
      toast({
        title: 'Sucesso',
        description: 'Vídeo adicionado à fila de processamento',
      });

      refetchQueue(); // Atualiza a fila imediatamente após adicionar um novo vídeo
    } catch (error) {
      console.error('Erro ao adicionar vídeo:', error);
      toast({
        title: 'Erro ao adicionar vídeo',
        description: error instanceof Error ? error.message : 'Ocorreu um erro desconhecido',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const removeFromQueue = async (videoId: string) => {
    try {
      const response = await fetch(`/api/admin/youtube-downloader/${videoId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Erro ao remover vídeo da fila');
      }
      
      toast({
        title: 'Sucesso',
        description: 'Vídeo removido da fila',
      });

      refetchQueue(); // Atualiza a fila após remover o vídeo
    } catch (error) {
      console.error('Erro ao remover vídeo:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível remover o vídeo da fila',
        variant: 'destructive'
      });
    }
  };

  // Status mapping para melhor legibilidade
  const statusConfig: Record<string, { 
    label: string; 
    icon: React.ElementType; 
    variant: 'default' | 'destructive' | 'outline' | 'secondary' | 'success'; 
    description: string 
  }> = {
    waiting: {
      label: 'Aguardando',
      icon: Clock,
      variant: 'secondary',
      description: 'Na fila de processamento'
    },
    downloading: {
      label: 'Baixando',
      icon: Loader2,
      variant: 'secondary',
      description: 'Baixando vídeo do YouTube'
    },
    uploading: {
      label: 'Enviando',
      icon: Loader2,
      variant: 'secondary',
      description: 'Enviando para servidor de streaming'
    },
    completed: {
      label: 'Concluído',
      icon: CheckCircle2,
      variant: 'success',
      description: 'Vídeo processado com sucesso'
    },
    error: {
      label: 'Erro',
      icon: AlertCircle,
      variant: 'destructive',
      description: 'Falha no processamento'
    }
  };

  // Função para abrir o player de vídeo
  const openVideoPlayer = (video: VideoQueueItem) => {
    if (video.url_video) {
      // Extrair o playback_id da URL do vídeo
      // A URL segue o formato: https://stream.mux.com/{PLAYBACK_ID}
      const playbackId = video.url_video.split('/').pop();
      setCurrentVideoUrl(playbackId || null);
      setCurrentVideoTitle(video.titulo || 'Vídeo');
      setVideoPlayerOpen(true);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">YouTube Downloader</h1>
          <p className="text-muted-foreground mt-1">
            Adicione URLs do YouTube à fila de processamento
          </p>
        </div>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={() => refetchQueue()}
                className="h-10 w-10"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              Atualizar status dos vídeos
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <Card className="p-6">
        <div className="space-y-4">
          {/* Input de URL com validação e feedback */}
          <div className="flex gap-3">
            <div className="flex-1">
              <Label htmlFor="youtube-url" className="sr-only">URL do YouTube</Label>
              <Input
                id="youtube-url"
                placeholder="Cole a URL do YouTube aqui"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={isSubmitting}
                className="h-12"
              />
            </div>
            <Button
              onClick={() => addToQueue(url)}
              disabled={!url || isSubmitting || !primaryCategory}
              className="h-12 px-6"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              Adicionar
            </Button>
          </div>

          {/* Seção de Categorias */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Categoria Principal */}
            <div className="space-y-2">
              <Label className="font-medium">Categoria Principal</Label>
              <Select
                value={primaryCategory?.id || ""}
                onValueChange={(value) => {
                  const category = categories.find(c => c.id === value);
                  if (category) handleSetPrimaryCategory(category);
                }}
                disabled={isSubmitting}
              >
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Selecione a categoria principal" />
                </SelectTrigger>
                <SelectContent>
                  <ScrollArea className="h-[200px]">
                    {renderCategories()}
                  </ScrollArea>
                </SelectContent>
              </Select>
            </div>

            {/* Categorias Secundárias */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="font-medium">Categorias Secundárias</Label>
                <Dialog open={showNewCategoryDialog} onOpenChange={setShowNewCategoryDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Nova
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Nova Categoria</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="categoryName">Nome da Categoria</Label>
                        <Input
                          id="categoryName"
                          value={newCategory.nome}
                          onChange={(e) => setNewCategory({ ...newCategory, nome: e.target.value })}
                          placeholder="Nome da categoria"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="parentCategory">Categoria Pai (opcional)</Label>
                        <Select 
                          value={newCategory.parent_id || ""} 
                          onValueChange={(value) => {
                            setNewCategory({ ...newCategory, parent_id: value || null });
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a categoria pai" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((category) => (
                              <SelectItem
                                key={category.id}
                                value={category.id}
                                textValue={category.nome}
                                className={cn(
                                  "flex items-center gap-2",
                                  { "pl-[calc(24px*var(--level,0))]": category._indentLevel && category._indentLevel > 0 }
                                )}
                                style={{
                                  '--level': category._indentLevel
                                } as React.CSSProperties}
                              >
                                <div className="flex items-center gap-2 truncate">
                                  {category._indentLevel && category._indentLevel > 0 && (
                                    <ChevronRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                                  )}
                                  <span className="truncate">{category.nome}</span>
                                  {category.cor && (
                                    <span 
                                      className="w-3 h-3 rounded-full inline-block flex-shrink-0"
                                      style={{ backgroundColor: category.cor }}
                                    />
                                  )}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="categoryDescription">Descrição da Categoria</Label>
                        <Input
                          id="categoryDescription"
                          value={newCategory.descricao}
                          onChange={(e) => setNewCategory({ ...newCategory, descricao: e.target.value })}
                          placeholder="Descrição da categoria"
                        />
                      </div>
                      <Button
                        type="button"
                        onClick={handleCreateCategory}
                        disabled={isSubmitting}
                        className="w-full"
                      >
                        {isSubmitting ? 'Criando...' : 'Criar Categoria'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              <Select
                value=""
                onValueChange={(value) => {
                  const category = categories.find(c => c.id === value);
                  if (category) handleCategorySelect(category);
                }}
                disabled={isSubmitting}
              >
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Adicionar categoria secundária" />
                </SelectTrigger>
                <SelectContent>
                  <ScrollArea className="h-[200px]">
                    {categories
                      .filter(category => !selectedAdditionalCategories.some(sc => sc === category.id))
                      .map((category) => (
                        <SelectItem
                          key={category.id}
                          value={category.id}
                          className="flex items-center gap-2"
                        >
                          <span className="truncate">{category.nome}</span>
                          {category.cor && (
                            <span 
                              className="w-3 h-3 rounded-full shrink-0"
                              style={{ backgroundColor: category.cor }}
                            />
                          )}
                        </SelectItem>
                      ))}
                  </ScrollArea>
                </SelectContent>
              </Select>

              {/* Tags das categorias selecionadas */}
              <div className="flex flex-wrap gap-2 min-h-[2.5rem] p-2 border rounded-md bg-muted/5">
                <AnimatePresence>
                  {selectedAdditionalCategories.map((categoryId) => {
                    const category = categories.find(c => c.id === categoryId);
                    if (category) {
                      return (
                        <motion.div
                          key={category.id}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                        >
                          <Badge
                            variant="secondary"
                            className="flex items-center gap-1"
                            style={category.cor ? {
                              backgroundColor: category.cor,
                              borderColor: category.cor,
                              color: '#fff'
                            } : undefined}
                          >
                            {category.nome}
                            <button
                              type="button"
                              onClick={() => handleRemoveCategory(category.id)}
                              className="ml-1 hover:text-red-200 focus:outline-none"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        </motion.div>
                      );
                    }
                    return null;
                  })}
                </AnimatePresence>
                {selectedAdditionalCategories.length === 0 && (
                  <p className="text-sm text-muted-foreground p-1">
                    Nenhuma categoria selecionada
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Fila de Processamento */}
      {videoQueue.length > 0 && (
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-semibold">Fila de Processamento</h2>
                <Badge variant="outline" className="h-6">
                  {videoQueue.length} {videoQueue.length === 1 ? 'vídeo' : 'vídeos'}
                </Badge>
              </div>
              <div className="flex gap-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const completedVideos = videoQueue.filter(
                            (v: VideoQueueItem) => v.processing_status === 'completed'
                          );
                          completedVideos.forEach((v: VideoQueueItem) => removeFromQueue(v.id));
                        }}
                        disabled={!videoQueue.some(
                          (v: VideoQueueItem) => v.processing_status === 'completed'
                        )}
                      >
                        <Trash className="h-4 w-4 mr-2" />
                        Limpar Concluídos
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      Remover vídeos processados da fila
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>

            <div className="space-y-3">
              <AnimatePresence>
                {videoQueue.map((video: VideoQueueItem) => {
                  const status = statusConfig[video.processing_status] || {
                    label: 'Desconhecido',
                    icon: AlertCircle,
                    variant: 'secondary',
                    description: 'Status desconhecido'
                  };
                  const StatusIcon = status.icon;
                  const isAnimated = video.is_processing || ['downloading', 'uploading', 'waiting'].includes(video.processing_status);

                  return (
                    <motion.div
                      key={video.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="group"
                    >
                      <div className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors">
                        <div className="flex items-center gap-4 min-w-0 flex-1">
                          {video.thumbnail_url && (
                            <div className="shrink-0 w-16 h-12 rounded-md overflow-hidden relative">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img 
                                src={video.thumbnail_url} 
                                alt={video.titulo || 'Thumbnail'} 
                                className="object-cover w-full h-full"
                              />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">
                              {video.titulo || video.youtube_url}
                            </p>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground mt-0.5">
                              <p>
                                {video.status_description || status.description}
                              </p>
                              {video.time_ago && (
                                <>
                                  <span>•</span>
                                  <p>{video.time_ago}</p>
                                </>
                              )}
                              {video.error && (
                                <>
                                  <span>•</span>
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <span className="text-destructive cursor-help">Ver detalhes do erro</span>
                                      </TooltipTrigger>
                                      <TooltipContent side="bottom" align="start" className="max-w-xs">
                                        <p className="break-words text-xs">{video.error}</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={status.variant}
                              className="flex items-center gap-2"
                            >
                              <StatusIcon className={cn(
                                "h-3 w-3",
                                isAnimated && "animate-spin"
                              )} />
                              {status.label}
                            </Badge>
                            
                            {video.processing_status === 'completed' && video.url_video && (
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-primary hover:text-primary/80 transition-colors"
                                onClick={() => openVideoPlayer(video)}
                              >
                                <PlayCircle className="h-5 w-5" />
                              </Button>
                            )}
                            
                            {(video.processing_status === 'error' || video.processing_status === 'completed') && (
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => removeFromQueue(video.id)}
                              >
                                <Trash className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
              
              {videoQueue.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Nenhum vídeo na fila de processamento</p>
                </div>
              )}
            </div>
          </div>
        </Card>
      )}

      <Dialog open={videoPlayerOpen} onOpenChange={setVideoPlayerOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>{currentVideoTitle}</DialogTitle>
          </DialogHeader>
          <div className="relative pt-[56.25%] w-full overflow-hidden rounded-md">
            {currentVideoUrl && (
              <iframe 
                src={`https://player.mux.com/${currentVideoUrl}`}
                allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
                allowFullScreen
                className="absolute top-0 left-0 w-full h-full border-0"
              ></iframe>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 