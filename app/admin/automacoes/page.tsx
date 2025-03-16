import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import React from "react";
import { Bot, Loader2, Plus, Trash2, Search, CheckCircle, Clock, AlertCircle, Filter, MoreHorizontal, Pencil, ArrowRight, KeyRound, File, Upload, PowerIcon } from "lucide-react";
import SEOHead from "@/components/SEOHead";
import AdminLayout from "@/layouts/AdminLayout";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Link } from "wouter";
import * as XLSX from 'xlsx';
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface Automacao {
  id: string;
  nome: string;
  descricao: string;
  tipo: string;
  ativo: boolean;
  configuracao: string;
  ultimaExecucao: string | null;
  criadoEm: string;
  atualizadoEm: string;
}

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

export default function AutomacoesAdmin() {
  const queryClient = useQueryClient();
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedAutomacao, setSelectedAutomacao] = useState<Automacao | null>(null);
  
  // Estado para gerenciamento de keywords
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Estado para adicionar nova keyword
  const [newKeyword, setNewKeyword] = useState<string>('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState<boolean>(false);
  const [isBatchDialogOpen, setIsBatchDialogOpen] = useState<boolean>(false);
  const [batchKeywords, setBatchKeywords] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Estado para seleção de múltiplos itens
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false);

  // Estado para edição de keyword
  const [editingKeyword, setEditingKeyword] = useState<Keyword | null>(null);
  const [editedTopic, setEditedTopic] = useState<string>('');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState<boolean>(false);

  const { data: automacoes, isLoading } = useQuery<Automacao[]>({
    queryKey: ["/api/admin/automacoes"],
    queryFn: async () => {
      const response = await fetch('/api/admin/automacoes');
      if (!response.ok) {
        throw new Error('Erro ao buscar automações');
      }
      return response.json();
    }
  });

  // Efeito para selecionar a automação de geração de artigos por padrão
  useEffect(() => {
    if (automacoes && automacoes.length > 0) {
      const geradorArtigos = automacoes.find(a => a.tipo === "article-generator" || a.nome.includes("Gerador de Artigos"));
      if (geradorArtigos) {
        setSelectedAutomacao(geradorArtigos);
      }
    }
  }, [automacoes]);

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

  // Query para buscar as keywords
  const keywordsQueryKey = ['/api/keywords', page, limit, debouncedSearchTerm, statusFilter];
  
  const { data: keywordsData, isLoading: keywordsLoading } = useQuery<KeywordsResponse>({
    queryKey: keywordsQueryKey,
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
    enabled: !!selectedAutomacao && selectedAutomacao.tipo === "article-generator"
  });

  const updateAutomacao = useMutation({
    mutationFn: async (data: { id: string; ativo: boolean }) => {
      const response = await fetch(`/api/admin/automacoes/${data.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ativo: data.ativo }),
      });
      
      if (!response.ok) {
        throw new Error("Erro ao atualizar automação");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/automacoes"] });
      toast({
        title: "Automação atualizada",
        description: "A automação foi atualizada com sucesso!",
        variant: "default",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar automação",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsUpdating(false);
    },
  });

  // Mutation para adicionar uma keyword
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
        throw new Error('Erro ao adicionar palavra-chave');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/keywords'] });
      setNewKeyword('');
      setIsAddDialogOpen(false);
      toast({
        title: "Palavra-chave adicionada",
        description: "A palavra-chave foi adicionada com sucesso!",
        variant: "default",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao adicionar palavra-chave",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    },
  });

  // Mutation para adicionar keywords em lote
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
        throw new Error('Erro ao adicionar palavras-chave em lote');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/keywords'] });
      setBatchKeywords('');
      setIsBatchDialogOpen(false);
      toast({
        title: "Palavras-chave adicionadas",
        description: `${data.added} palavras-chave adicionadas com sucesso!`,
        variant: "default",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao adicionar palavras-chave em lote",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    },
  });

  // Mutation para excluir uma keyword
  const deleteKeywordMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/keywords/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Erro ao excluir palavra-chave');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/keywords'] });
      toast({
        title: "Palavra-chave excluída",
        description: "A palavra-chave foi excluída com sucesso!",
        variant: "default",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao excluir palavra-chave",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    },
  });

  // Mutation para excluir keywords em lote
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
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/keywords'] });
      setSelectedIds([]);
      setIsDeleteDialogOpen(false);
      toast.success('Palavras-chave excluídas com sucesso!');
    },
    onError: (error) => {
      toast.error(`Erro ao excluir palavras-chave em lote: ${error.message}`);
    },
  });

  // Mutation para editar uma keyword
  const editKeywordMutation = useMutation({
    mutationFn: async ({ id, topic }: { id: string; topic: string }) => {
      const response = await fetch(`/api/keywords/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ topic }),
      });
      
      if (!response.ok) {
        throw new Error('Erro ao editar palavra-chave');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/keywords'] });
      setEditingKeyword(null);
      setEditedTopic('');
      setIsEditDialogOpen(false);
      toast.success('Palavra-chave atualizada com sucesso!');
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar palavra-chave: ${error.message}`);
    },
  });

  const handleToggleAutomacao = async (id: string, ativo: boolean) => {
    setIsUpdating(true);
    await updateAutomacao.mutateAsync({ id, ativo });
  };

  const handleAddKeyword = () => {
    if (newKeyword.trim()) {
      addKeywordMutation.mutate(newKeyword.trim());
    }
  };

  const handleAddBatchKeywords = () => {
    if (batchKeywords.trim()) {
      const topics = batchKeywords
        .split('\n')
        .map(line => line.trim())
        .filter(Boolean);
      
      if (topics.length) {
        addBatchKeywordsMutation.mutate(topics);
      }
    }
  };

  const handleDeleteKeyword = (id: string) => {
    deleteKeywordMutation.mutate(id);
  };

  const handleDeleteBatchKeywords = () => {
    if (selectedIds.length) {
      deleteBatchKeywordsMutation.mutate(selectedIds);
    }
  };

  const handleSelectAll = () => {
    if (keywordsData?.keywords) {
      if (selectedIds.length === keywordsData.keywords.length) {
        setSelectedIds([]);
      } else {
        setSelectedIds(keywordsData.keywords.map(kw => kw.id));
      }
    }
  };

  const handleSelectKeyword = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(itemId => itemId !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleEditKeyword = () => {
    if (editingKeyword && editedTopic.trim()) {
      editKeywordMutation.mutate({ 
        id: editingKeyword.id, 
        topic: editedTopic.trim() 
      });
    }
  };

  const openEditDialog = (keyword: Keyword) => {
    setEditingKeyword(keyword);
    setEditedTopic(keyword.topic);
    setIsEditDialogOpen(true);
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'POSTED':
        return <Badge className="bg-green-500 hover:bg-green-600"><CheckCircle className="h-3 w-3 mr-1" /> Publicado</Badge>;
      case 'PENDING':
        return <Badge variant="outline" className="border-yellow-500 text-yellow-500"><Clock className="h-3 w-3 mr-1" /> Pendente</Badge>;
      case 'ERROR':
        return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" /> Erro</Badge>;
      default:
        return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" /> Não Publicado</Badge>;
    }
  };

  // Renderizar páginas de paginação
  const renderPagination = () => {
    if (!keywordsData || keywordsData.total === 0) return null;
    
    const totalPages = keywordsData.totalPages;
    if (totalPages <= 1) return null;
    
    return (
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious 
              onClick={() => setPage(page > 1 ? page - 1 : 1)}
              className={page <= 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'} 
            />
          </PaginationItem>
          
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter(p => p === 1 || p === totalPages || (p >= page - 1 && p <= page + 1))
            .map((p, i, arr) => {
              // Adicionar elipses quando necessário
              if (i > 0 && arr[i - 1] !== p - 1) {
                return (
                  <React.Fragment key={`ellipsis-${p}`}>
                    <PaginationItem>
                      <PaginationEllipsis />
                    </PaginationItem>
                    <PaginationItem>
                      <PaginationLink 
                        isActive={page === p}
                        onClick={() => setPage(p)}
                      >
                        {p}
                      </PaginationLink>
                    </PaginationItem>
                  </React.Fragment>
                );
              }
              
              return (
                <PaginationItem key={p}>
                  <PaginationLink 
                    isActive={page === p}
                    onClick={() => setPage(p)}
                  >
                    {p}
                  </PaginationLink>
                </PaginationItem>
              );
            })}
          
          <PaginationItem>
            <PaginationNext 
              onClick={() => setPage(page < totalPages ? page + 1 : totalPages)}
              className={page >= totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'} 
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    );
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
        
        if (keywordColIndex !== -1) {
          // Extrair keywords da coluna encontrada (pulando o cabeçalho)
          keywords = lines
            .slice(1)
            .map(line => line.split(',')[keywordColIndex]?.trim())
            .filter((keyword): keyword is string => !!keyword && keyword.length > 0);
        } else {
          // Se não encontrar uma coluna específica, usar a primeira coluna
          keywords = lines
            .slice(1)
            .map(line => line.split(',')[0]?.trim())
            .filter((keyword): keyword is string => !!keyword && keyword.length > 0);
        }
        
        // Atualizar o campo de texto com as palavras-chave extraídas
        setBatchKeywords(keywords.join('\n'));
        
        toast({
          title: "Sucesso",
          description: `${keywords.length} palavras-chave extraídas do arquivo CSV.`,
        });
      } else if (fileType === 'txt') {
        const text = await file.text();
        
        // Dividir por linhas e filtrar linhas vazias
        const keywords = text
          .split(/\r?\n/)
          .map(line => line.trim())
          .filter(line => line.length > 0);
        
        // Atualizar o campo de texto com as palavras-chave extraídas
        setBatchKeywords(keywords.join('\n'));
        
        toast({
          title: "Sucesso",
          description: `${keywords.length} palavras-chave extraídas do arquivo TXT.`,
        });
      } else if (fileType === 'xlsx' || fileType === 'xls') {
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'array' });
        
        // Pegar a primeira planilha
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Converter para JSON
        const jsonData = XLSX.utils.sheet_to_json<any>(worksheet);
        
        // Procurar por colunas que podem conter keywords
        const keywordKeys = Object.keys(jsonData[0] || {}).filter(key => 
          key.toLowerCase().includes('keyword') ||
          key.toLowerCase().includes('palavra') ||
          key.toLowerCase().includes('termo')
        );
        
        let keywords: string[] = [];
        
        if (keywordKeys.length > 0) {
          // Usar a primeira coluna identificada como keyword
          const keywordKey = keywordKeys[0];
          
          toast({
            title: "Processando",
            description: `Extraindo da coluna: ${keywordKey}`,
          });
          
          // Extrair apenas os valores da coluna de keyword
          keywords = jsonData
            .map(row => row[keywordKey]?.toString().trim())
            .filter((keyword): keyword is string => !!keyword && keyword.length > 0);
        } else {
          // Se não encontrar uma coluna específica, tentar usar a primeira coluna da planilha
          toast({
            title: "Aviso",
            description: "Coluna de keywords não identificada. Utilizando a primeira coluna da planilha",
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
          title: "Sucesso",
          description: `${keywords.length} palavras-chave extraídas do arquivo Excel.`,
        });
      } else {
        toast({
          title: "Erro",
          description: "Por favor, carregue um arquivo CSV, TXT ou Excel (XLSX).",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível processar o arquivo. Verifique o formato e estrutura.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      // Limpar o input de arquivo para permitir selecionar o mesmo arquivo novamente
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Adicionando verificação null/undefined na busca pela automação
  const automacaoArticleGenerator = automacoes?.find(a => a.tipo === "article-generator");

  // Função para alternar o estado da automação
  const toggleAutomacao = async (id: string, currentState: boolean) => {
    setIsUpdating(true);
    try {
      const response = await fetch(`/api/admin/automacoes/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ativo: !currentState
        }),
      });

      if (!response.ok) {
        throw new Error('Falha ao atualizar automação');
      }

      await response.json();
      
      // Atualizar dados usando queryClient
      queryClient.invalidateQueries({ queryKey: ["/api/admin/automacoes"] });
      
      toast.success(`Automação ${!currentState ? 'ativada' : 'desativada'} com sucesso! As alterações serão aplicadas em até 1 minuto.`);
    } catch (error) {
      toast.error("Ocorreu um erro ao tentar atualizar o status da automação. Tente novamente.");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <>
      <SEOHead
        title="Automações | Admin"
        description="Gerenciamento de automações do sistema"
      />
      
      <AdminLayout title="Automações">
        <div className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-6">
            <div className="flex items-center mb-4">
              <Bot className="h-6 w-6 text-primary mr-2" />
              <h3 className="text-lg font-medium">Automações do Sistema</h3>
            </div>
            
            <p className="text-gray-500 mb-6">
              Gerencie as automações do sistema. Você pode ativar ou desativar cada automação conforme necessário.
            </p>

            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="space-y-4">
                {automacoes?.map((automacao) => (
                  <div
                    key={automacao.id}
                    className={`bg-white border rounded-lg p-4 ${selectedAutomacao?.id === automacao.id ? 'border-primary ring-1 ring-primary' : ''}`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div 
                          className={automacao.tipo === "article-generator" ? "cursor-pointer hover:text-primary transition-colors" : ""}
                          onClick={automacao.tipo === "article-generator" ? () => {
                            setSelectedAutomacao(automacao);
                            document.getElementById('keywords-tab')?.scrollIntoView({ behavior: 'smooth' });
                          } : undefined}
                        >
                          <h4 className="font-medium">{automacao.nome}</h4>
                          <p className="text-sm text-gray-500">{automacao.descricao}</p>
                          {automacao.ultimaExecucao && (
                            <p className="text-xs text-gray-400 mt-1">
                              Última execução: {new Date(automacao.ultimaExecucao).toLocaleString("pt-BR")}
                            </p>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-500">
                            {automacao.ativo ? "Ativo" : "Inativo"}
                          </span>
                          <Switch
                            checked={automacao.ativo}
                            disabled={isUpdating}
                            onCheckedChange={(checked) => handleToggleAutomacao(automacao.id, checked)}
                          />
                        </div>
                      </div>
                      
                      {automacao.tipo === "article-generator" && (
                        <div className="pt-2 text-xs text-primary italic text-right flex items-center justify-end gap-2">
                          <span>Clique no nome para gerenciar palavras-chave</span>
                          <Button
                            variant="outline"
                            size="sm"
                            asChild
                            className="text-xs"
                          >
                            <Link href="/admin/keywords">
                              <ArrowRight className="h-3 w-3 mr-1" />
                              Ver Todas
                            </Link>
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {(!automacoes || automacoes.length === 0) && (
                  <p className="text-center text-gray-500 py-4">
                    Nenhuma automação configurada.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Detalhes da automação selecionada (apenas para Gerador de Artigos) */}
          {selectedAutomacao && selectedAutomacao.tipo === "article-generator" && (
            <div id="keywords-tab" className="bg-white rounded-lg border p-6">
              <Tabs defaultValue="keywords" className="w-full">
                <TabsList className="mb-4">
                  <TabsTrigger value="keywords">Palavras-chave</TabsTrigger>
                  <TabsTrigger value="config">Configurações</TabsTrigger>
                </TabsList>
                
                <TabsContent value="keywords" className="space-y-4">
                  <CardHeader className="px-0 pt-0">
                    <CardTitle>Gerenciamento de Palavras-chave</CardTitle>
                    <CardDescription>
                      Gerencie as palavras-chave para geração automática de artigos
                    </CardDescription>
                  </CardHeader>
                  
                  <div className="flex flex-col md:flex-row gap-4 mb-4">
                    <div className="flex-1 relative">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                      <Input
                        placeholder="Buscar palavras-chave..."
                        className="pl-8"
                        value={searchTerm}
                        onChange={(e) => handleSearchChange(e.target.value)}
                      />
                    </div>
                    
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-full md:w-[180px]">
                        <div className="flex items-center">
                          <Filter className="mr-2 h-4 w-4" />
                          <SelectValue placeholder="Filtrar por status" />
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="NOT_POSTED">Não Publicados</SelectItem>
                        <SelectItem value="PENDING">Pendentes</SelectItem>
                        <SelectItem value="POSTED">Publicados</SelectItem>
                        <SelectItem value="ERROR">Com Erro</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                      <DialogTrigger asChild>
                        <Button>
                          <Plus className="mr-2 h-4 w-4" /> Nova Palavra-chave
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Adicionar Palavra-chave</DialogTitle>
                          <DialogDescription>
                            Adicione uma nova palavra-chave para geração de artigo.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="py-4">
                          <Input
                            placeholder="Digite a palavra-chave..."
                            value={newKeyword}
                            onChange={(e) => setNewKeyword(e.target.value)}
                          />
                        </div>
                        <DialogFooter>
                          <Button
                            variant="outline"
                            onClick={() => setIsAddDialogOpen(false)}
                          >
                            Cancelar
                          </Button>
                          <Button onClick={handleAddKeyword}>Adicionar</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <Dialog open={isBatchDialogOpen} onOpenChange={setIsBatchDialogOpen}>
                          <DialogTrigger asChild>
                            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                              <Plus className="mr-2 h-4 w-4" /> Adicionar em Lote
                            </DropdownMenuItem>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                              <DialogTitle>Adicionar Palavras-chave em Lote</DialogTitle>
                              <DialogDescription>
                                Adicione múltiplas palavras-chave ao mesmo tempo, uma por linha.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="py-4">
                              <div className="flex flex-col gap-2 mb-4">
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
                                placeholder="Digite as palavras-chave, uma por linha..."
                                value={batchKeywords}
                                onChange={(e) => setBatchKeywords(e.target.value)}
                                rows={8}
                              />
                            </div>
                            <DialogFooter>
                              <Button
                                variant="outline"
                                onClick={() => setIsBatchDialogOpen(false)}
                              >
                                Cancelar
                              </Button>
                              <Button 
                                onClick={handleAddBatchKeywords}
                                disabled={addBatchKeywordsMutation.isPending || isUploading}
                              >
                                {addBatchKeywordsMutation.isPending ? (
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
                        
                        <DropdownMenuSeparator />
                        
                        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                          <DialogTrigger asChild>
                            <DropdownMenuItem
                              onSelect={(e) => e.preventDefault()}
                              disabled={selectedIds.length === 0}
                              className={selectedIds.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> Excluir Selecionados
                            </DropdownMenuItem>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Confirmar Exclusão</DialogTitle>
                              <DialogDescription>
                                Tem certeza que deseja excluir {selectedIds.length} palavra(s)-chave selecionada(s)?
                                Esta ação não pode ser desfeita.
                              </DialogDescription>
                            </DialogHeader>
                            <DialogFooter>
                              <Button
                                variant="outline"
                                onClick={() => setIsDeleteDialogOpen(false)}
                              >
                                Cancelar
                              </Button>
                              <Button
                                variant="destructive"
                                onClick={handleDeleteBatchKeywords}
                              >
                                Excluir
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  
                  {keywordsLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : (
                    <>
                      {keywordsData?.keywords && keywordsData.keywords.length > 0 ? (
                        <div className="rounded-md border">
                          <div className="relative w-full overflow-auto">
                            <table className="w-full caption-bottom text-sm">
                              <thead className="[&_tr]:border-b">
                                <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                  <th className="h-12 px-4 text-left align-middle font-medium">
                                    <div className="flex items-center space-x-2">
                                      <Checkbox
                                        checked={keywordsData.keywords.length > 0 && selectedIds.length === keywordsData.keywords.length}
                                        onCheckedChange={handleSelectAll}
                                      />
                                    </div>
                                  </th>
                                  <th className="h-12 px-4 text-left align-middle font-medium">Palavra-chave</th>
                                  <th className="h-12 px-4 text-left align-middle font-medium">Status</th>
                                  <th className="h-12 px-4 text-left align-middle font-medium">Data de Criação</th>
                                  <th className="h-12 px-4 text-left align-middle font-medium">Ações</th>
                                </tr>
                              </thead>
                              <tbody className="[&_tr:last-child]:border-0">
                                {keywordsData.keywords.map((keyword) => (
                                  <tr
                                    key={keyword.id}
                                    className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
                                  >
                                    <td className="p-4 align-middle">
                                      <Checkbox
                                        checked={selectedIds.includes(keyword.id)}
                                        onCheckedChange={() => handleSelectKeyword(keyword.id)}
                                      />
                                    </td>
                                    <td className="p-4 align-middle font-medium">{keyword.topic}</td>
                                    <td className="p-4 align-middle">{renderStatusBadge(keyword.status)}</td>
                                    <td className="p-4 align-middle">{new Date(keyword.criadoEm).toLocaleString('pt-BR')}</td>
                                    <td className="p-4 align-middle">
                                      <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                          <Button variant="ghost" size="sm">
                                            <MoreHorizontal className="h-4 w-4" />
                                          </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                          <DropdownMenuItem
                                            onClick={() => openEditDialog(keyword)}
                                            className="text-blue-600"
                                          >
                                            <Pencil className="mr-2 h-4 w-4" /> Editar
                                          </DropdownMenuItem>
                                          <DropdownMenuItem
                                            onClick={() => handleDeleteKeyword(keyword.id)}
                                            className="text-red-600"
                                          >
                                            <Trash2 className="mr-2 h-4 w-4" /> Excluir
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
                      ) : (
                        <div className="text-center py-12 text-gray-500">
                          <p className="mb-4">Nenhuma palavra-chave encontrada.</p>
                          <Button onClick={() => setIsAddDialogOpen(true)}>
                            <Plus className="mr-2 h-4 w-4" /> Adicionar Palavra-chave
                          </Button>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between mt-4">
                        <div className="text-sm text-gray-500">
                          Exibindo {keywordsData?.keywords?.length || 0} de {keywordsData?.total || 0} resultados
                        </div>
                        {renderPagination()}
                      </div>
                    </>
                  )}
                </TabsContent>
                
                <TabsContent value="config">
                  <Card>
                    <CardHeader>
                      <CardTitle>Configurações do Gerador de Artigos</CardTitle>
                      <CardDescription>
                        Configurações específicas para a automação de geração de artigos
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-sm font-medium">Status da Automação</h4>
                            <p className="text-sm text-gray-500">
                              Ative ou desative a automação de geração de artigos
                            </p>
                          </div>
                          <Switch
                            checked={selectedAutomacao.ativo}
                            disabled={isUpdating}
                            onCheckedChange={(checked) => handleToggleAutomacao(selectedAutomacao.id, checked)}
                          />
                        </div>
                        
                        <div className="pt-4">
                          <h4 className="text-sm font-medium mb-2">Próxima Execução</h4>
                          {selectedAutomacao.ultimaExecucao ? (
                            <p className="text-sm text-gray-700">
                              Última execução: {new Date(selectedAutomacao.ultimaExecucao).toLocaleString("pt-BR")}
                            </p>
                          ) : (
                            <p className="text-sm text-gray-500">Nenhuma execução anterior registrada</p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </div>

        {/* Modal de edição */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Palavra-chave</DialogTitle>
              <DialogDescription>
                Modifique o conteúdo da palavra-chave selecionada.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Input
                placeholder="Digite a palavra-chave..."
                value={editedTopic}
                onChange={(e) => setEditedTopic(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button onClick={handleEditKeyword}>Salvar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </AdminLayout>
    </>
  );
} 