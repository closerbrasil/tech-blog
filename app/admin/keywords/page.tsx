import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useRef, useEffect } from "react";
import * as XLSX from 'xlsx';
import {
  Search,
  Plus,
  Trash2,
  Filter,
  MoreHorizontal,
  Upload,
  Loader2,
  CheckCircle,
  Clock,
  AlertCircle,
  FileText,
  Download,
  RefreshCw,
  File,
  ChevronDown
} from "lucide-react";
import AdminLayout from "@/layouts/AdminLayout";
import SEOHead from "@/components/SEOHead";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";

// Interface para a estrutura da palavra-chave
interface Keyword {
  id: string;
  topic: string;
  status: 'NOT_POSTED' | 'POSTED' | 'PENDING' | 'ERROR';
  criadoEm: string;
  atualizadoEm: string;
}

interface KeywordsResponse {
  keywords: Keyword[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function KeywordsPage() {
  const queryClient = useQueryClient();
  
  // Estado para controlar a paginação e filtros
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Estado para adicionar nova palavra-chave
  const [newKeyword, setNewKeyword] = useState<string>('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState<boolean>(false);
  const [isBatchDialogOpen, setIsBatchDialogOpen] = useState<boolean>(false);
  const [batchKeywords, setBatchKeywords] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Estado para seleção de múltiplos itens
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false);

  // Estado para a query do React Query
  const queryKey = ['/api/keywords', page, limit, debouncedSearchTerm, statusFilter];
  
  // Estado para controle da visualização responsiva
  const [isMobile, setIsMobile] = useState<boolean>(false);
  
  // Detectar se é um dispositivo móvel ou não
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Verificar no carregamento inicial
    checkIfMobile();
    
    // Adicionar event listener para redimensionamento
    window.addEventListener('resize', checkIfMobile);
    
    // Cleanup
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);
  
  // Função para debounce da busca
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      setPage(1); // Reset para a primeira página ao buscar
      setDebouncedSearchTerm(value);
    }, 500);
  };

  // Query para buscar as palavras-chave
  const { data, isLoading, isError } = useQuery<KeywordsResponse>({
    queryKey,
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', limit.toString());
      
      if (debouncedSearchTerm) {
        params.append('search', debouncedSearchTerm);
      }
      
      if (statusFilter && statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      
      const response = await fetch(`/api/keywords?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Erro ao buscar palavras-chave');
      }
      return response.json();
    },
  });

  // Mutation para adicionar uma palavra-chave
  const addKeywordMutation = useMutation({
    mutationFn: async (topic: string) => {
      const response = await fetch('/api/keywords', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ topic }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Erro ao adicionar palavra-chave');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/keywords'] });
      setNewKeyword('');
      setIsAddDialogOpen(false);
      toast({
        title: 'Palavra-chave adicionada',
        description: 'A palavra-chave foi adicionada com sucesso.',
        variant: 'default',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Mutation para adicionar palavras-chave em lote
  const addBatchKeywordsMutation = useMutation({
    mutationFn: async (topics: string[]) => {
      const response = await fetch('/api/keywords/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ topics }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Erro ao adicionar palavras-chave em lote');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/keywords'] });
      setBatchKeywords('');
      setIsBatchDialogOpen(false);
      toast({
        title: 'Palavras-chave adicionadas',
        description: `${data.added} palavra(s) adicionada(s), ${data.skipped} ignorada(s) por já existirem.`,
        variant: 'default',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Mutation para excluir uma palavra-chave
  const deleteKeywordMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/keywords/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Erro ao excluir palavra-chave');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/keywords'] });
      toast({
        title: 'Palavra-chave excluída',
        description: 'A palavra-chave foi excluída com sucesso.',
        variant: 'default',
      });
    },
    onError: () => {
      toast({
        title: 'Erro',
        description: 'Erro ao excluir palavra-chave',
        variant: 'destructive',
      });
    },
  });

  // Mutation para excluir palavras-chave em lote
  const deleteBatchKeywordsMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const response = await fetch('/api/keywords/batch', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ids }),
      });
      
      if (!response.ok) {
        throw new Error('Erro ao excluir palavras-chave em lote');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/keywords'] });
      setSelectedIds([]);
      setIsDeleteDialogOpen(false);
      toast({
        title: 'Palavras-chave excluídas',
        description: 'As palavras-chave selecionadas foram excluídas com sucesso.',
        variant: 'default',
      });
    },
    onError: () => {
      toast({
        title: 'Erro',
        description: 'Erro ao excluir palavras-chave',
        variant: 'destructive',
      });
    },
  });

  // Mutation para atualizar o status de uma palavra-chave
  const updateKeywordStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const response = await fetch(`/api/keywords/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });
      
      if (!response.ok) {
        throw new Error('Erro ao atualizar status da palavra-chave');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/keywords'] });
      toast({
        title: 'Status atualizado',
        description: 'O status da palavra-chave foi atualizado com sucesso.',
        variant: 'default',
      });
    },
    onError: () => {
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar status da palavra-chave',
        variant: 'destructive',
      });
    },
  });

  // Handler para adicionar uma palavra-chave
  const handleAddKeyword = () => {
    if (!newKeyword.trim()) {
      toast({
        title: 'Erro',
        description: 'Informe uma palavra-chave válida',
        variant: 'destructive',
      });
      return;
    }
    
    addKeywordMutation.mutate(newKeyword.trim());
  };

  // Função para processar o arquivo carregado
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setIsUploading(true);
    
    try {
      // Verificar o tipo de arquivo
      const fileType = file.name.split('.').pop()?.toLowerCase();
      
      if (fileType === 'csv') {
        const text = await file.text();
        
        // Dividir por linhas
        const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
        
        // Se não houver linhas, retornar
        if (lines.length === 0) {
          throw new Error('Arquivo vazio ou sem conteúdo válido');
        }
        
        // Verificar se a primeira linha contém cabeçalhos
        const headers = lines[0].split(',').map(header => header.trim().toLowerCase());
        
        // Procurar por uma coluna de keywords
        const keywordColIndex = headers.findIndex(header => 
          header === 'keyword' || 
          header === 'keywords' || 
          header === 'palavra-chave' || 
          header === 'palavras-chave' ||
          header === 'termo'
        );
        
        let keywords: string[] = [];
        
        if (keywordColIndex >= 0) {
          // Extrair apenas a coluna de keywords
          keywords = lines.slice(1)
            .map(line => {
              const columns = line.split(',');
              return columns[keywordColIndex]?.trim() || '';
            })
            .filter(keyword => keyword.length > 0);
            
          toast({
            title: 'Coluna de keywords encontrada',
            description: `Extraindo da coluna: ${headers[keywordColIndex]}`,
            variant: 'default',
          });
        } else {
          // Se não encontrar um cabeçalho específico, assume que cada linha é uma keyword ou coluna única
          toast({
            title: 'Coluna de keywords não identificada',
            description: 'Assumindo que cada linha contém uma keyword por coluna',
            variant: 'default',
          });
          
          keywords = lines
            .slice(headers.length > 0 ? 1 : 0) // Pular o cabeçalho se existir
            .flatMap(line => line.split(','))
            .map(keyword => keyword.trim())
            .filter(keyword => keyword.length > 0);
        }
        
        // Atualizar o campo de texto com as palavras-chave extraídas
        setBatchKeywords(keywords.join('\n'));
        
        toast({
          title: 'Arquivo CSV processado',
          description: `${keywords.length} palavras-chave extraídas do arquivo.`,
          variant: 'default',
        });
      } else if (fileType === 'txt' || fileType === 'text') {
        const text = await file.text();
        
        // Para arquivos TXT, assumir uma palavra-chave por linha
        const keywords = text
          .split(/\r?\n/)
          .map(line => line.trim())
          .filter(line => line.length > 0);
        
        // Atualizar o campo de texto com as palavras-chave extraídas
        setBatchKeywords(keywords.join('\n'));
        
        toast({
          title: 'Arquivo TXT processado',
          description: `${keywords.length} palavras-chave extraídas do arquivo.`,
          variant: 'default',
        });
      } else if (fileType === 'xlsx' || fileType === 'xls') {
        // Processar arquivos Excel
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        
        // Obter a primeira planilha
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Converter para JSON com cabeçalhos
        const jsonData = XLSX.utils.sheet_to_json<any>(worksheet);
        
        // Procurar pela coluna de palavras-chave no JSON
        const keywordKeys = Object.keys(jsonData[0] || {}).filter(key => 
          key.toLowerCase().includes('keyword') || 
          key.toLowerCase().includes('palavra') || 
          key.toLowerCase().includes('termo') ||
          key.toLowerCase() === 'key'
        );
        
        let keywords: string[] = [];
        
        if (keywordKeys.length > 0) {
          // Usar a primeira coluna identificada como keyword
          const keywordKey = keywordKeys[0];
          
          toast({
            title: 'Coluna de keywords encontrada',
            description: `Extraindo da coluna: ${keywordKey}`,
            variant: 'default',
          });
          
          // Extrair apenas os valores da coluna de keyword
          keywords = jsonData
            .map(row => row[keywordKey]?.toString().trim())
            .filter((keyword): keyword is string => !!keyword && keyword.length > 0);
        } else {
          // Se não encontrar uma coluna específica, tentar usar a primeira coluna da planilha
          toast({
            title: 'Coluna de keywords não identificada',
            description: 'Utilizando a primeira coluna da planilha',
            variant: 'default',
          });
          
          // Obter dados da primeira coluna
          const allData = XLSX.utils.sheet_to_json<any>(worksheet, { header: 1 });
          
          // Extrair valores da primeira coluna (pulando o cabeçalho)
          keywords = allData
            .slice(1)
            .map(row => (row[0] ? row[0].toString().trim() : ''))
            .filter(keyword => keyword && keyword.length > 0);
        }
        
        // Atualizar o campo de texto com as palavras-chave extraídas
        setBatchKeywords(keywords.join('\n'));
        
        toast({
          title: 'Arquivo Excel processado',
          description: `${keywords.length} palavras-chave extraídas do arquivo.`,
          variant: 'default',
        });
      } else {
        toast({
          title: 'Formato não suportado',
          description: 'Por favor, carregue um arquivo CSV, TXT ou Excel (XLSX).',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Erro ao processar arquivo:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível processar o arquivo. Verifique o formato e estrutura.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
      // Limpar o input de arquivo para permitir selecionar o mesmo arquivo novamente
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Handler para adicionar palavras-chave em lote
  const handleAddBatchKeywords = () => {
    if (!batchKeywords.trim()) {
      toast({
        title: 'Erro',
        description: 'Informe pelo menos uma palavra-chave',
        variant: 'destructive',
      });
      return;
    }
    
    // Dividir por novas linhas e filtrar strings vazias
    const topics = batchKeywords
      .split('\n')
      .map(topic => topic.trim())
      .filter(topic => topic.length > 0);
    
    if (topics.length === 0) {
      toast({
        title: 'Erro',
        description: 'Informe pelo menos uma palavra-chave válida',
        variant: 'destructive',
      });
      return;
    }
    
    addBatchKeywordsMutation.mutate(topics);
  };

  // Handler para excluir uma palavra-chave
  const handleDeleteKeyword = (id: string) => {
    deleteKeywordMutation.mutate(id);
  };

  // Handler para excluir palavras-chave em lote
  const handleDeleteBatchKeywords = () => {
    if (selectedIds.length === 0) {
      toast({
        title: 'Erro',
        description: 'Selecione pelo menos uma palavra-chave para excluir',
        variant: 'destructive',
      });
      return;
    }
    
    deleteBatchKeywordsMutation.mutate(selectedIds);
  };

  // Handler para selecionar/desselecionar todas as palavras-chave
  const handleSelectAll = () => {
    if (!data?.keywords) return;
    
    if (selectedIds.length === data.keywords.length) {
      // Se todas estão selecionadas, desseleciona todas
      setSelectedIds([]);
    } else {
      // Senão, seleciona todas
      setSelectedIds(data.keywords.map(keyword => keyword.id));
    }
  };

  // Handler para selecionar/desselecionar uma palavra-chave
  const handleSelectKeyword = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(selectedId => selectedId !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  // Função para renderizar o badge de status
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'NOT_POSTED':
        return (
          <Badge variant="outline" className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>Pendente</span>
          </Badge>
        );
      case 'POSTED':
        return (
          <Badge className="bg-green-100 text-green-800 flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            <span>Publicado</span>
          </Badge>
        );
      case 'PENDING':
        return (
          <Badge variant="secondary" className="flex items-center gap-1">
            <RefreshCw className="h-3 w-3" />
            <span>Em processamento</span>
          </Badge>
        );
      case 'ERROR':
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            <span>Erro</span>
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            {status}
          </Badge>
        );
    }
  };

  // Função para renderizar a lista em formato de cartões para dispositivos móveis
  const renderMobileKeywordList = () => {
    if (!data?.keywords || data.keywords.length === 0) return null;
    
    return (
      <div className="grid grid-cols-1 gap-3">
        {data.keywords.map((keyword) => (
          <div key={keyword.id} className="border rounded-lg p-4 bg-background">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <Checkbox
                  checked={selectedIds.includes(keyword.id)}
                  onCheckedChange={() => handleSelectKeyword(keyword.id)}
                  aria-label={`Selecionar ${keyword.topic}`}
                />
                <div className="space-y-1">
                  <h4 className="font-medium text-sm">{keyword.topic}</h4>
                  <div className="flex items-center gap-2">
                    {renderStatusBadge(keyword.status)}
                    <span className="text-xs text-muted-foreground">
                      {new Date(keyword.criadoEm).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </div>
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => 
                    updateKeywordStatusMutation.mutate({ id: keyword.id, status: 'NOT_POSTED' })
                  }>
                    <Clock className="h-4 w-4 mr-2" />
                    Marcar como Pendente
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => 
                    updateKeywordStatusMutation.mutate({ id: keyword.id, status: 'POSTED' })
                  }>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Marcar como Publicado
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleDeleteKeyword(keyword.id)} className="text-destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Excluir
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <>
      <SEOHead
        title="Gerenciar Palavras-chave | Admin"
        description="Gerencie as palavras-chave para o gerador automático de artigos"
      />
      
      <AdminLayout title="Palavras-chave">
        <Card className="h-[calc(100vh-10rem)] flex flex-col">
          <CardHeader className="shrink-0 pb-3">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <CardTitle>Gerenciar Palavras-chave</CardTitle>
                <CardDescription>
                  Gerencie os tópicos para geração automática de artigos
                </CardDescription>
              </div>
              
              <div className="flex flex-wrap gap-2 w-full md:w-auto justify-end">
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="h-9">
                      <Plus className="h-4 w-4 mr-2" />
                      <span>Adicionar</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Adicionar Palavra-chave</DialogTitle>
                      <DialogDescription>
                        Adicione uma nova palavra-chave para gerar artigos automaticamente.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Input
                          id="topic"
                          placeholder="Ex: Inteligência Artificial no Marketing"
                          value={newKeyword}
                          onChange={(e) => setNewKeyword(e.target.value)}
                        />
                      </div>
                    </div>
                    <DialogFooter className="flex-col sm:flex-row gap-2">
                      <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} className="w-full sm:w-auto">
                        Cancelar
                      </Button>
                      <Button onClick={handleAddKeyword} disabled={addKeywordMutation.isPending} className="w-full sm:w-auto">
                        {addKeywordMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Adicionando...
                          </>
                        ) : (
                          <>Adicionar</>
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                
                <Dialog open={isBatchDialogOpen} onOpenChange={setIsBatchDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline" className="h-9">
                      <Upload className="h-4 w-4 mr-2" />
                      <span className="hidden sm:inline">Importar em Lote</span>
                      <span className="inline sm:hidden">Importar</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Adicionar em Lote</DialogTitle>
                      <DialogDescription>
                        Adicione múltiplas palavras-chave de uma vez, uma por linha.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium">
                          Carregar arquivo (CSV, TXT, XLSX)
                        </label>
                        <div className="flex items-center gap-2">
                          <Input
                            type="file"
                            accept=".csv,.txt,.text,.xlsx,.xls"
                            onChange={handleFileUpload}
                            ref={fileInputRef}
                            className="flex-1"
                            disabled={isUploading}
                          />
                          {isUploading && <Loader2 className="h-4 w-4 animate-spin" />}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Ou digite manualmente as palavras-chave abaixo, uma por linha
                        </p>
                      </div>
                      <Textarea
                        placeholder="Digite uma palavra-chave por linha"
                        value={batchKeywords}
                        onChange={(e) => setBatchKeywords(e.target.value)}
                        rows={10}
                      />
                    </div>
                    <DialogFooter className="flex-col sm:flex-row gap-2">
                      <Button variant="outline" onClick={() => setIsBatchDialogOpen(false)} className="w-full sm:w-auto">
                        Cancelar
                      </Button>
                      <Button
                        onClick={handleAddBatchKeywords}
                        disabled={addBatchKeywordsMutation.isPending || isUploading}
                        className="w-full sm:w-auto"
                      >
                        {addBatchKeywordsMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Importando...
                          </>
                        ) : (
                          <>Importar</>
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" variant="outline" className="h-9">
                      <MoreHorizontal className="h-4 w-4 mr-2" />
                      <span className="hidden sm:inline">Ações</span>
                      <ChevronDown className="h-4 w-4 ml-0 sm:ml-1" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem 
                      disabled={selectedIds.length === 0}
                      onClick={() => setIsDeleteDialogOpen(true)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Excluir Selecionados
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      <Download className="h-4 w-4 mr-2" />
                      Exportar CSV
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="flex-1 flex flex-col min-h-0">
            <div className="flex flex-col h-full">
              <div className="shrink-0 flex flex-col sm:flex-row justify-between gap-3 bg-background pt-2 pb-4 z-10">
                <div className="relative w-full sm:max-w-xs">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    placeholder="Buscar palavras-chave..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => handleSearchChange(e.target.value)}
                  />
                </div>
                
                <div className="flex flex-wrap items-center gap-2">
                  <Select
                    value={statusFilter}
                    onValueChange={(value) => {
                      setStatusFilter(value);
                      setPage(1);
                    }}
                  >
                    <SelectTrigger className="w-full sm:w-[180px] h-9">
                      <SelectValue placeholder="Filtrar por status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os status</SelectItem>
                      <SelectItem value="NOT_POSTED">Pendentes</SelectItem>
                      <SelectItem value="POSTED">Publicados</SelectItem>
                      <SelectItem value="PENDING">Em processamento</SelectItem>
                      <SelectItem value="ERROR">Com erro</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-9 ml-auto sm:ml-0"
                    onClick={() => {
                      setSearchTerm('');
                      setDebouncedSearchTerm('');
                      setStatusFilter('');
                      setPage(1);
                    }}
                    disabled={!searchTerm && !statusFilter}
                  >
                    Limpar filtros
                  </Button>
                </div>
              </div>
              
              <div className="flex-1 min-h-0">
                {isLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : isError ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <AlertCircle className="h-10 w-10 text-destructive mx-auto mb-4" />
                      <h3 className="text-lg font-medium">Erro ao carregar palavras-chave</h3>
                      <p className="text-muted-foreground">
                        Não foi possível carregar as palavras-chave. Tente novamente mais tarde.
                      </p>
                      <Button
                        variant="outline"
                        className="mt-4"
                        onClick={() => queryClient.invalidateQueries({ queryKey })}
                      >
                        Tentar novamente
                      </Button>
                    </div>
                  </div>
                ) : data?.keywords && data.keywords.length > 0 ? (
                  <>
                    {/* Visualização de tabela para desktop e visualização de cards para mobile */}
                    {isMobile ? (
                      // Visualização de cards para dispositivos móveis
                      <div className="grid grid-cols-1 gap-3">
                        {renderMobileKeywordList()}
                      </div>
                    ) : (
                      // Visualização de tabela para desktop
                      <div className="h-full flex flex-col">
                        <div className="border rounded-md flex-1 min-h-0">
                          <table className="w-full divide-y">
                            <thead className="bg-muted/50">
                              <tr>
                                <th className="p-3 text-left w-10">
                                  <Checkbox
                                    checked={data.keywords.length > 0 && selectedIds.length === data.keywords.length}
                                    onCheckedChange={handleSelectAll}
                                    aria-label="Selecionar todas as palavras-chave"
                                  />
                                </th>
                                <th className="p-3 text-left font-medium text-muted-foreground text-sm">
                                  Palavra-chave
                                </th>
                                <th className="p-3 text-left font-medium text-muted-foreground text-sm">
                                  Status
                                </th>
                                <th className="p-3 text-left font-medium text-muted-foreground text-sm">
                                  Data de criação
                                </th>
                                <th className="p-3 text-right w-20"></th>
                              </tr>
                            </thead>
                            <tbody className="divide-y">
                              {data.keywords.map((keyword) => (
                                <tr key={keyword.id} className="hover:bg-muted/50 transition-colors">
                                  <td className="p-3">
                                    <Checkbox
                                      checked={selectedIds.includes(keyword.id)}
                                      onCheckedChange={() => handleSelectKeyword(keyword.id)}
                                      aria-label={`Selecionar ${keyword.topic}`}
                                    />
                                  </td>
                                  <td className="p-3 align-middle">
                                    <div className="flex flex-col">
                                      <span className="font-medium">{keyword.topic}</span>
                                    </div>
                                  </td>
                                  <td className="p-3 align-middle">
                                    {renderStatusBadge(keyword.status)}
                                  </td>
                                  <td className="p-3 align-middle text-sm text-muted-foreground">
                                    {new Date(keyword.criadoEm).toLocaleDateString('pt-BR')}
                                  </td>
                                  <td className="p-3 text-right align-middle">
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                          <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => 
                                          updateKeywordStatusMutation.mutate({ id: keyword.id, status: 'NOT_POSTED' })
                                        }>
                                          <Clock className="h-4 w-4 mr-2" />
                                          Marcar como Pendente
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => 
                                          updateKeywordStatusMutation.mutate({ id: keyword.id, status: 'POSTED' })
                                        }>
                                          <CheckCircle className="h-4 w-4 mr-2" />
                                          Marcar como Publicado
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={() => handleDeleteKeyword(keyword.id)} className="text-destructive">
                                          <Trash2 className="h-4 w-4 mr-2" />
                                          Excluir
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <FileText className="h-12 w-12 text-muted-foreground opacity-20 mx-auto mb-4" />
                      <h3 className="text-lg font-medium">Nenhuma palavra-chave encontrada</h3>
                      <p className="text-muted-foreground mt-1">
                        {searchTerm || statusFilter
                          ? "Tente ajustar os filtros ou buscar por outro termo."
                          : "Adicione palavras-chave para gerar artigos automaticamente."}
                      </p>
                      {searchTerm || statusFilter ? (
                        <Button
                          variant="outline"
                          className="mt-4"
                          onClick={() => {
                            setSearchTerm('');
                            setDebouncedSearchTerm('');
                            setStatusFilter('');
                          }}
                        >
                          Limpar filtros
                        </Button>
                      ) : (
                        <Button
                          className="mt-4"
                          onClick={() => setIsAddDialogOpen(true)}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Adicionar Palavra-chave
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Paginação */}
              {data && data.totalPages > 1 && (
                <div className="shrink-0 flex flex-col sm:flex-row items-center justify-between gap-4 bg-background pt-4">
                  <div className="text-sm text-muted-foreground order-2 sm:order-1">
                    Mostrando <span className="font-medium">{(page - 1) * limit + 1}</span> a{" "}
                    <span className="font-medium">
                      {Math.min(page * limit, data.total)}
                    </span>{" "}
                    de <span className="font-medium">{data.total}</span> resultados
                  </div>
                  
                  <Pagination className="order-1 sm:order-2">
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => setPage(old => Math.max(old - 1, 1))}
                          className={page === 1 ? "pointer-events-none opacity-50" : ""}
                        />
                      </PaginationItem>
                      
                      {!isMobile && Array.from({ length: Math.min(5, data.totalPages) }, (_, i) => {
                        let pageNumber;
                        
                        if (data.totalPages <= 5) {
                          pageNumber = i + 1;
                        } else if (page <= 3) {
                          pageNumber = i + 1;
                        } else if (page >= data.totalPages - 2) {
                          pageNumber = data.totalPages - 4 + i;
                        } else {
                          pageNumber = page - 2 + i;
                        }
                        
                        return (
                          <PaginationItem key={pageNumber} className="hidden sm:inline-block">
                            <PaginationLink
                              onClick={() => setPage(pageNumber)}
                              isActive={page === pageNumber}
                            >
                              {pageNumber}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      })}
                      
                      {!isMobile && data.totalPages > 5 && page < data.totalPages - 2 && (
                        <PaginationItem>
                          <PaginationEllipsis />
                        </PaginationItem>
                      )}
                      
                      {/* Mostrar apenas a página atual em dispositivos móveis */}
                      {isMobile && (
                        <PaginationItem>
                          <PaginationLink isActive={true}>
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      )}
                      
                      <PaginationItem>
                        <PaginationNext
                          onClick={() => setPage(old => Math.min(old + 1, data.totalPages))}
                          className={page === data.totalPages ? "pointer-events-none opacity-50" : ""}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </AdminLayout>
      
      {/* Dialog de confirmação para excluir múltiplas palavras-chave */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Excluir Palavras-chave</DialogTitle>
            <DialogDescription>
              Você tem certeza que deseja excluir {selectedIds.length} palavra(s)-chave?
              Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} className="w-full sm:w-auto">
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteBatchKeywords}
              disabled={deleteBatchKeywordsMutation.isPending}
              className="w-full sm:w-auto"
            >
              {deleteBatchKeywordsMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Excluindo...
                </>
              ) : (
                <>Excluir</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
} 