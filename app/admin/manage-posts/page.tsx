'use client';

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import AdminLayout from "@/layouts/AdminLayout";
import { DataTable } from "@/components/ui/data-table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Loader2, FileText, Plus, Filter, Search, MoreVertical } from "lucide-react";
import type { Noticia } from "@/shared/schema";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function ManagePostsPage() {
  const { toast } = useToast();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [selectedPosts, setSelectedPosts] = useState<string[]>([]);
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);
  const pageSize = 10;

  // Buscar artigos paginados
  const { data, isLoading } = useQuery<{ noticias: Noticia[], total: number }>({
    queryKey: ["/api/noticias", currentPage, pageSize, searchTerm],
    queryFn: async () => {
      const res = await fetch(
        `/api/noticias?page=${currentPage}&limit=${pageSize}&search=${searchTerm}&exclude=videos`
      );
      if (!res.ok) throw new Error("Falha ao carregar notícias");
      return res.json();
    },
  });

  // Mutação para excluir artigo
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/noticias/${id}`, {
        method: "DELETE",
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error("Erro na exclusão:", errorText);
        throw new Error("Falha ao excluir notícia");
      }
      
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/noticias"] });
      toast({
        title: "Notícia excluída com sucesso",
        description: "A notícia foi removida permanentemente",
      });
      setDeleteDialogOpen(false);
    },
    onError: (error) => {
      console.error("Erro na mutação:", error);
      toast({
        title: "Erro ao excluir notícia",
        description: error instanceof Error ? error.message : "Ocorreu um erro desconhecido",
        variant: "destructive",
      });
    },
  });

  // Mutação para excluir múltiplos artigos
  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const deletePromises = ids.map(id => 
        fetch(`/api/noticias/${id}`, { method: "DELETE" })
      );
      
      const results = await Promise.allSettled(deletePromises);
      
      const successCount = results.filter(r => r.status === 'fulfilled').length;
      const failCount = results.filter(r => r.status === 'rejected').length;
      
      return { successCount, failCount };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["/api/noticias"] });
      
      if (result.failCount === 0) {
        toast({
          title: "Exclusão em massa concluída",
          description: `${result.successCount} ${result.successCount === 1 ? 'item foi removido' : 'itens foram removidos'} com sucesso`
        });
      } else {
        toast({
          title: "Exclusão em massa parcialmente concluída",
          description: `${result.successCount} ${result.successCount === 1 ? 'item removido' : 'itens removidos'} com sucesso. ${result.failCount} ${result.failCount === 1 ? 'falha' : 'falhas'}.`,
          variant: "destructive"
        });
      }
      
      setSelectedPosts([]);
      setIsBulkDeleteDialogOpen(false);
    },
    onError: (error) => {
      console.error("Erro na exclusão em massa:", error);
      toast({
        title: "Erro ao excluir itens",
        description: error instanceof Error ? error.message : "Ocorreu um erro desconhecido",
        variant: "destructive",
      });
    },
  });

  // Manipuladores
  const handleDeleteClick = (id: string) => {
    setSelectedPostId(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (selectedPostId) {
      deleteMutation.mutate(selectedPostId);
    }
  };

  const confirmBulkDelete = () => {
    if (selectedPosts.length > 0) {
      bulkDeleteMutation.mutate(selectedPosts);
    }
  };

  // Manipuladores de seleção
  const togglePostSelection = (id: string) => {
    setSelectedPosts(prev => 
      prev.includes(id) 
        ? prev.filter(postId => postId !== id) 
        : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (!data?.noticias) return;
    
    if (selectedPosts.length === data.noticias.length) {
      setSelectedPosts([]);
    } else {
      setSelectedPosts(data.noticias.map(noticia => noticia.id));
    }
  };

  const columns = [
    {
      header: "Título",
      key: "titulo",
      render: (noticia: Noticia) => (
        <div className="flex flex-col">
          <span className="font-medium truncate">{noticia.titulo}</span>
          <span className="text-xs text-muted-foreground">/{noticia.slug}</span>
        </div>
      )
    },
    {
      header: "Status",
      key: "status",
      render: (noticia: Noticia) => (
        <Badge variant={noticia.status === "publicado" ? "default" : "secondary"}> 
          {noticia.status === "publicado" ? "Publicado" : "Rascunho"}
        </Badge>
      )
    },
    {
      header: "Categoria",
      key: "categoria",
      className: "hidden md:table-cell",
      render: (noticia: Noticia) => (
        <span className="text-sm">{noticia.categoria_id}</span>
      )
    },
    {
      header: "Data",
      key: "data",
      className: "hidden md:table-cell",
      render: (noticia: Noticia) => (
        <div className="flex flex-col">
          <span className="text-sm">
            {new Date(noticia.publicado_em).toLocaleDateString("pt-BR")}
          </span>
          <span className="text-xs text-muted-foreground">
            {new Date(noticia.publicado_em).toLocaleTimeString("pt-BR")}
          </span>
        </div>
      )
    },
    {
      header: "Ações",
      key: "acoes",
      render: (noticia: Noticia) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[160px]">
            <DropdownMenuItem onClick={() => router.push(`/noticia/${noticia.slug}`)}>
              Visualizar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push(`/admin/edit-post/${noticia.id}`)}>
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => handleDeleteClick(noticia.id)}
              className="text-destructive"
            >
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    }
  ];

  return (
    <>
      <SEOHead
        title="Gerenciar Artigos | Admin"
        description="Gerenciamento de artigos do portal"
      />

      <AdminLayout>
        <div className="flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex-1 space-y-1.5">
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Gerenciar Artigos</h1>
              <p className="text-sm sm:text-base text-muted-foreground">
                Gerencie todos os artigos do portal de notícias
              </p>
            </div>

            <Button 
              onClick={() => router.push("/admin/create-post")}
              size="default"
              className="w-full sm:w-auto h-11 touch-manipulation active:scale-[0.98] transition-transform"
            >
              <Plus className="w-4 h-4 mr-2" />
              Criar Novo Artigo
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar artigos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 h-11"
                />
              </div>
            </div>
            <Button
              variant="outline"
              size="default"
              className="w-full sm:w-auto h-11"
            >
              <Filter className="w-4 h-4 mr-2" />
              Filtros
            </Button>
          </div>

          <div className="rounded-lg border shadow-sm">
            {isLoading ? (
              <div className="flex items-center justify-center h-[400px]">
                <div className="flex flex-col items-center gap-3">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary/30 border-t-primary"></div>
                  <p className="text-sm text-muted-foreground">Carregando artigos...</p>
                </div>
              </div>
            ) : data?.noticias?.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[400px] px-4 text-center">
                <div className="flex flex-col items-center gap-2">
                  <FileText className="h-12 w-12 text-muted-foreground/50" />
                  <h3 className="font-medium text-lg">Nenhum artigo encontrado</h3>
                  <p className="text-sm text-muted-foreground">
                    Comece criando seu primeiro artigo clicando no botão acima.
                  </p>
                </div>
              </div>
            ) : (
              <div className="overflow-hidden">
                <DataTable
                  data={data?.noticias || []}
                  columns={columns}
                  totalItems={data?.total || 0}
                  currentPage={currentPage}
                  pageSize={pageSize}
                  onPageChange={setCurrentPage}
                  selectedItems={selectedPosts}
                  onItemSelect={togglePostSelection}
                  onSelectAll={toggleSelectAll}
                  getId={(item: Noticia) => item.id}
                />
              </div>
            )}
          </div>
        </div>

        {/* Diálogo de confirmação de exclusão */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>Confirmar exclusão</DialogTitle>
              <DialogDescription>
                Tem certeza que deseja excluir este artigo? Esta ação não pode ser desfeita.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <div className="flex flex-col-reverse sm:flex-row gap-2 w-full sm:w-auto">
                <Button
                  variant="outline"
                  onClick={() => setDeleteDialogOpen(false)}
                  disabled={deleteMutation.isPending}
                  className="w-full sm:w-auto h-10"
                >
                  Cancelar
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => selectedPostId && deleteMutation.mutate(selectedPostId)}
                  disabled={deleteMutation.isPending}
                  className="w-full sm:w-auto h-10"
                >
                  {deleteMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Excluindo...
                    </>
                  ) : (
                    "Excluir"
                  )}
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Diálogo de confirmação de exclusão em massa */}
        <Dialog open={isBulkDeleteDialogOpen} onOpenChange={setIsBulkDeleteDialogOpen}>
          <DialogContent className="sm:max-w-[400px] p-0">
            <DialogHeader className="p-6 pb-0">
              <DialogTitle className="text-xl font-semibold">Confirmar exclusão em massa</DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground mt-2">
                Você está prestes a excluir {selectedPosts.length} {selectedPosts.length === 1 ? 'item' : 'itens'}.
                Esta ação não pode ser desfeita. Deseja continuar?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="p-6 pt-4">
              <div className="flex flex-col-reverse sm:flex-row gap-2 w-full sm:w-auto">
                <Button
                  variant="outline"
                  onClick={() => setIsBulkDeleteDialogOpen(false)}
                  disabled={bulkDeleteMutation.isPending}
                  className="w-full sm:w-auto h-10"
                >
                  Cancelar
                </Button>
                <Button
                  variant="destructive"
                  onClick={confirmBulkDelete}
                  disabled={bulkDeleteMutation.isPending}
                  className="w-full sm:w-auto h-10"
                >
                  {bulkDeleteMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    "Excluir Selecionados"
                  )}
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </AdminLayout>
    </>
  );
}