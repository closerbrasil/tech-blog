'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, X, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

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

export default function YouTubeDownloader() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<Category[]>([]);
  const [primaryCategory, setPrimaryCategory] = useState<Category | null>(null);
  const [showNewCategoryDialog, setShowNewCategoryDialog] = useState(false);
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

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categorias');
        if (!response.ok) {
          throw new Error('Erro ao buscar categorias');
        }
        const data = await response.json();
        console.log('Categorias recebidas:', data); // Log para debug
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
      setLoading(true);
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
      setLoading(false);
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
    if (!selectedCategories.some(sc => sc.id === safeCategory.id)) {
      setSelectedCategories(prev => [...prev, safeCategory]);
    }
  };

  const handleCategorySelect = (category: Category) => {
    // Garantir que a categoria seja exibida corretamente
    const safeCategory = ensureCategoryDisplay(category);
    if (!selectedCategories.some(sc => sc.id === safeCategory.id)) {
      setSelectedCategories(prev => [...prev, safeCategory]);
    }
  };

  const handleRemoveCategory = (category: Category) => {
    setSelectedCategories(prev => prev.filter(sc => sc.id !== category.id));
    if (primaryCategory?.id === category.id) {
      setPrimaryCategory(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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

    setLoading(true);

    try {
      const response = await fetch('/api/admin/youtube-downloader', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: url.trim(),
          category_id: primaryCategory.id,
          additional_categories: selectedCategories
            .filter(sc => sc.id !== primaryCategory.id)
            .map(sc => sc.id)
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

      toast({
        title: 'Sucesso',
        description: 'Vídeo está sendo processado',
      });

      setUrl('');
      setSelectedCategories([]);
      setPrimaryCategory(null);
    } catch (error) {
      console.error('Erro ao processar vídeo:', error);
      toast({
        title: 'Erro ao processar vídeo',
        description: error instanceof Error ? error.message : 'Ocorreu um erro desconhecido',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>YouTube Downloader</CardTitle>
          <CardDescription>
            Cole a URL do vídeo do YouTube e selecione as categorias
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="url">URL do YouTube</Label>
              <Input
                id="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                disabled={loading}
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Categorias</Label>
                <Dialog open={showNewCategoryDialog} onOpenChange={setShowNewCategoryDialog}>
                  <DialogTrigger asChild>
                    <Button type="button" variant="outline" size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Nova Categoria
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
                        disabled={loading}
                        className="w-full"
                      >
                        {loading ? 'Criando...' : 'Criar Categoria'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Categoria Principal */}
              <div className="space-y-2">
                <Label>Categoria Principal</Label>
                <Select
                  value={primaryCategory?.id || ""}
                  onValueChange={(value) => {
                    const category = categories.find(c => c.id === value);
                    if (category) {
                      handleSetPrimaryCategory(category);
                    }
                  }}
                  disabled={loading}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione a categoria principal" />
                  </SelectTrigger>
                  <SelectContent>
                    {renderCategories()}
                  </SelectContent>
                </Select>
              </div>

              {/* Categorias Selecionadas */}
              <div className="space-y-2">
                <Label>Categorias Selecionadas</Label>
                <div className="flex flex-wrap gap-2 min-h-[2.5rem] p-2 border rounded-md bg-muted/5">
                  {selectedCategories.map((category) => (
                    <Badge
                      key={category.id}
                      variant={category.id === primaryCategory?.id ? "default" : "secondary"}
                      className="flex items-center gap-1"
                      style={category.cor ? {
                        backgroundColor: category.id === primaryCategory?.id ? category.cor : undefined,
                        borderColor: category.id !== primaryCategory?.id ? category.cor : undefined,
                        color: category.id === primaryCategory?.id ? '#fff' : category.cor
                      } : undefined}
                    >
                      {category.nome}
                      {category.id === primaryCategory?.id && (
                        <span className="text-[10px] opacity-90">(principal)</span>
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveCategory(category);
                        }}
                        className="ml-1 hover:text-destructive focus:outline-none"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                  {selectedCategories.length === 0 && (
                    <p className="text-sm text-muted-foreground p-1">
                      Nenhuma categoria selecionada
                    </p>
                  )}
                </div>
              </div>

              {/* Adicionar Categorias Secundárias */}
              <div className="space-y-2">
                <Label>Adicionar Categorias Secundárias</Label>
                <Select
                  value=""
                  onValueChange={(value) => {
                    const category = categories.find(c => c.id === value);
                    if (category) {
                      handleCategorySelect(category);
                    }
                  }}
                  disabled={loading}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione categorias adicionais" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories
                      .filter(category => !selectedCategories.some(sc => sc.id === category.id))
                      .map((category) => (
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
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Processando...' : 'Processar Vídeo'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 