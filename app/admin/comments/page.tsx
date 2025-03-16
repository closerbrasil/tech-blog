import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminLayout from "@/layouts/AdminLayout";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Trash2, Loader2, XCircle, Eye, Link as LinkIcon } from "lucide-react";
import type { Comentario } from "@shared/schema";

// Interface estendida para mapear corretamente os campos do comentário
interface ComentarioVisao extends Comentario {
  autor: string; // Representa autorNome formatado
  email: string; // Campo adicional para exibição
  noticia?: {
    titulo?: string;
    slug?: string;
  };
}

export default function CommentsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedComment, setSelectedComment] = useState<ComentarioVisao | null>(null);
  const pageSize = 10;

  // Buscar todos os comentários
  const { data, isLoading } = useQuery({
    queryKey: ["/api/comentarios", currentPage, pageSize],
    queryFn: async () => {
      const res = await fetch(`/api/comentarios?page=${currentPage}&limit=${pageSize}`);
      if (!res.ok) throw new Error("Falha ao carregar comentários");
      return res.json();
    },
  });

  // Mutação para aprovar comentário
  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/comentarios/${id}/aprovar`, {
        method: "PATCH",
      });
      if (!res.ok) throw new Error("Falha ao aprovar comentário");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/comentarios"] });
      toast({
        title: "Comentário aprovado",
        description: "O comentário foi aprovado com sucesso e agora está visível no site",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao aprovar comentário",
        description: error instanceof Error ? error.message : "Ocorreu um erro desconhecido",
        variant: "destructive",
      });
    },
  });

  // Mutação para excluir comentário
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/comentarios/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Falha ao excluir comentário");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/comentarios"] });
      toast({
        title: "Comentário excluído",
        description: "O comentário foi removido permanentemente",
      });
      setDeleteDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Erro ao excluir comentário",
        description: error instanceof Error ? error.message : "Ocorreu um erro desconhecido",
        variant: "destructive",
      });
    },
  });

  // Manipuladores
  const handleApproveClick = (id: string) => {
    approveMutation.mutate(id);
  };

  const handleDeleteClick = (comment: any) => {
    setSelectedComment(mapToComentarioVisao(comment));
    setDeleteDialogOpen(true);
  };

  const handleViewClick = (comment: any) => {
    setSelectedComment(mapToComentarioVisao(comment));
    setViewDialogOpen(true);
  };

  const confirmDelete = () => {
    if (selectedComment) {
      deleteMutation.mutate(selectedComment.id);
    }
  };

  // Calcular total de páginas
  const totalPages = data?.total ? Math.ceil(data.total / pageSize) : 0;

  // Navegação de páginas
  const goToPage = (page: number) => {
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Formatar data
  const formatDate = (dateStr: string | Date) => {
    const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };
  
  // Mapear Comentario para ComentarioVisao
  const mapToComentarioVisao = (comentario: Comentario): ComentarioVisao => {
    return {
      ...comentario,
      autor: comentario.autorNome || "Anônimo",
      email: "exemplo@email.com", // Valor temporário para testes - não está no schema
      noticia: {
        titulo: "Título da notícia", // Valor temporário - idealmente viria da API
        slug: "slug-da-noticia"      // Valor temporário - idealmente viria da API
      }
    };
  };

  return (
    <>
      <SEOHead
        title="Gerenciar Comentários | Admin"
        description="Gerencie os comentários do portal de notícias"
      />

      <AdminLayout title="Gerenciar Comentários">
        <div className="mb-6">
          <p className="text-gray-500">
            Aprove e modere os comentários enviados pelos leitores
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : (
          <>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Autor</TableHead>
                    <TableHead>Conteúdo</TableHead>
                    <TableHead>Notícia</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[150px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.comentarios && data.comentarios.length > 0 ? (
                    data.comentarios.map((comentario: Comentario) => {
                      // Converte para ComentarioVisao para acessar os campos adicionais
                      const comentarioVisao = mapToComentarioVisao(comentario);
                      
                      return (
                        <TableRow key={comentario.id}>
                          <TableCell className="font-medium">
                            {comentarioVisao.autor}
                            <div className="text-xs text-gray-500">{comentarioVisao.email}</div>
                          </TableCell>
                          <TableCell className="max-w-xs">
                            <div className="truncate">
                              {comentario.conteudo}
                            </div>
                          </TableCell>
                          <TableCell>
                            <a 
                              href={`/noticia/${comentarioVisao.noticia?.slug}`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex items-center text-primary hover:underline"
                            >
                              <LinkIcon className="h-3 w-3 mr-1" />
                              {comentarioVisao.noticia?.titulo?.substring(0, 20)}...
                            </a>
                          </TableCell>
                          <TableCell>
                            {formatDate(comentario.criadoEm)}
                          </TableCell>
                          <TableCell>
                            {comentario.aprovado ? (
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                Aprovado
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                                Pendente
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleViewClick(comentario)}
                              >
                                <Eye className="h-4 w-4" />
                                <span className="sr-only">Ver</span>
                              </Button>
                              
                              {!comentario.aprovado && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-green-600 hover:text-green-900"
                                  onClick={() => handleApproveClick(comentario.id)}
                                  disabled={approveMutation.isPending}
                                >
                                  {approveMutation.isPending && approveMutation.variables === comentario.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <CheckCircle2 className="h-4 w-4" />
                                  )}
                                  <span className="sr-only">Aprovar</span>
                                </Button>
                              )}
                              
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-red-600 hover:text-red-900"
                                onClick={() => handleDeleteClick(comentario)}
                              >
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Excluir</span>
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-6 text-gray-500">
                        Nenhum comentário encontrado
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Paginação */}
            {totalPages > 1 && (
              <div className="flex items-center justify-end space-x-2 py-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  Anterior
                </Button>
                <span className="text-sm text-gray-500">
                  Página {currentPage} de {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Próxima
                </Button>
              </div>
            )}
          </>
        )}

        {/* Diálogo para visualizar comentário */}
        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Visualizar Comentário</DialogTitle>
            </DialogHeader>
            
            {selectedComment && (
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-semibold text-gray-500">Autor</h4>
                  <p>{selectedComment.autor}</p>
                </div>
                
                <div>
                  <h4 className="text-sm font-semibold text-gray-500">Email</h4>
                  <p>{selectedComment.email}</p>
                </div>
                
                <div>
                  <h4 className="text-sm font-semibold text-gray-500">Data</h4>
                  <p>{formatDate(selectedComment.criadoEm)}</p>
                </div>
                
                <div>
                  <h4 className="text-sm font-semibold text-gray-500">Status</h4>
                  <p>
                    {selectedComment.aprovado ? (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        Aprovado
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                        Pendente
                      </Badge>
                    )}
                  </p>
                </div>
                
                <div>
                  <h4 className="text-sm font-semibold text-gray-500">Notícia</h4>
                  <p>
                    <a 
                      href={`/noticia/${selectedComment.noticia?.slug}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      {selectedComment.noticia?.titulo}
                    </a>
                  </p>
                </div>
                
                <div>
                  <h4 className="text-sm font-semibold text-gray-500">Conteúdo</h4>
                  <div className="p-3 bg-gray-50 rounded-md mt-1">
                    {selectedComment.conteudo}
                  </div>
                </div>
              </div>
            )}
            
            <DialogFooter>
              {selectedComment && !selectedComment.aprovado && (
                <Button
                  variant="outline"
                  className="mr-auto bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                  onClick={() => {
                    handleApproveClick(selectedComment.id);
                    setViewDialogOpen(false);
                  }}
                  disabled={approveMutation.isPending}
                >
                  {approveMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Aprovando...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Aprovar
                    </>
                  )}
                </Button>
              )}
              
              <Button
                type="button"
                variant="destructive"
                onClick={() => {
                  setViewDialogOpen(false);
                  if (selectedComment) {
                    handleDeleteClick(selectedComment);
                  }
                }}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir
              </Button>
              
              <Button
                type="button"
                onClick={() => setViewDialogOpen(false)}
              >
                Fechar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Diálogo de confirmação de exclusão */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar exclusão</DialogTitle>
              <DialogDescription>
                Tem certeza que deseja excluir este comentário? Esta ação não pode ser desfeita.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDeleteDialogOpen(false)}
                disabled={deleteMutation.isPending}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDelete}
                disabled={deleteMutation.isPending}
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
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </AdminLayout>
    </>
  );
}