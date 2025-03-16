import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminLayout from "@/layouts/AdminLayout";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Pencil, Trash2, Loader2, PlusCircle, Upload, User } from "lucide-react";
import type { Autor, InsertAutor } from "@/lib/api";
import { insertAutorSchema } from "@/lib/api";
import { useRef } from "react";

// Estender o schema para adicionar validações específicas
const autorSchema = insertAutorSchema;

type FormValues = z.infer<typeof autorSchema>;

export default function AuthorsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedAuthor, setSelectedAuthor] = useState<Autor | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Inicializar o formulário
  const form = useForm<FormValues>({
    resolver: zodResolver(autorSchema),
    defaultValues: {
      nome: "",
      slug: "",
      bio: "",
      avatar_url: "",
      cargo: "",
      email: "",
      twitter_url: "",
      linkedin_url: "",
      github_url: "",
      website_url: "",
    },
  });

  // Buscar autores
  const { data: autores, isLoading } = useQuery<Autor[]>({
    queryKey: ["/api/autores"],
  });

  // Mutação para criar/editar autor
  const saveMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      // Converter strings vazias para null
      const cleanData = Object.fromEntries(
        Object.entries(data).map(([key, value]) => [
          key,
          value === "" ? null : value
        ])
      );

      console.log("Dados a serem enviados:", cleanData);

      const options = {
        method: selectedAuthor ? "PATCH" : "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(cleanData),
        credentials: "include" as const
      };

      const url = selectedAuthor 
        ? `/api/autores/${selectedAuthor.id}`
        : "/api/autores";

      try {
        const res = await fetch(url, options);
        
        if (!res.ok) {
          const errorData = await res.text();
          console.error("Erro na resposta:", {
            status: res.status,
            statusText: res.statusText,
            headers: Object.fromEntries(res.headers.entries()),
            body: errorData
          });
          throw new Error(`Falha ao ${selectedAuthor ? 'atualizar' : 'criar'} autor: ${res.status} ${res.statusText}`);
        }

        return res.json();
      } catch (error) {
        console.error("Erro na requisição:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/autores"] });
      toast({
        title: "Autor salvo",
        description: "As alterações foram salvas com sucesso",
      });
      form.reset();
      setIsDialogOpen(false);
      setSelectedAuthor(null);
      setUploadedImage(null);
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Ocorreu um erro desconhecido",
        variant: "destructive",
      });
    },
  });

  // Mutação para excluir autor
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/autores/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Falha ao excluir autor");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/autores"] });
      toast({
        title: "Autor excluído",
        description: "O autor foi removido permanentemente",
      });
      setDeleteDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Erro ao excluir autor",
        description: error instanceof Error ? error.message : "Ocorreu um erro desconhecido",
        variant: "destructive",
      });
    },
  });

  // Manipular o upload de imagem
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    setIsUploading(true);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Erro ao fazer upload da imagem');
      }

      const data = await response.json();
      setUploadedImage(data.imageUrl);
      form.setValue('avatar_url', data.imageUrl);
      toast({
        title: "Upload concluído",
        description: "A imagem foi carregada com sucesso",
      });
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      toast({
        title: "Erro no upload",
        description: "Não foi possível carregar a imagem",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Abrir o diálogo de seleção de arquivo
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // Gerar slug a partir do nome
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\w\s]/g, "")
      .replace(/\s+/g, "-");
  };

  // Manipuladores
  const handleCreateClick = () => {
    form.reset({
      nome: "",
      slug: "",
      bio: "",
      avatar_url: "",
      cargo: "",
      email: "",
      twitter_url: "",
      linkedin_url: "",
      github_url: "",
      website_url: "",
    });
    setSelectedAuthor(null);
    setUploadedImage(null);
    setIsDialogOpen(true);
  };

  const handleEditClick = (autor: Autor) => {
    form.reset({
      nome: autor.nome,
      slug: autor.slug,
      bio: autor.bio,
      avatar_url: autor.avatar_url || "",
      cargo: autor.cargo || "",
      email: autor.email || "",
      twitter_url: autor.twitter_url || "",
      linkedin_url: autor.linkedin_url || "",
      github_url: autor.github_url || "",
      website_url: autor.website_url || "",
    });
    setSelectedAuthor(autor);
    setUploadedImage(autor.avatar_url || null);
    setIsDialogOpen(true);
  };

  const handleDeleteClick = (autor: Autor) => {
    setSelectedAuthor(autor);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (selectedAuthor) {
      deleteMutation.mutate(selectedAuthor.id);
    }
  };

  const onSubmit = (values: FormValues) => {
    saveMutation.mutate(values);
  };

  // Atualizar o slug quando o nome mudar
  const onNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    form.setValue("slug", generateSlug(name));
  };

  return (
    <>
      <SEOHead
        title="Gerenciar Autores | Admin"
        description="Gerencie os autores do portal de notícias"
      />

      <AdminLayout title="Gerenciar Autores">
        <div className="mb-6 flex items-center justify-between">
          <p className="text-gray-500">
            Gerencie todos os autores do portal de notícias
          </p>
          <Button onClick={handleCreateClick} className="flex items-center gap-2">
            <PlusCircle className="h-4 w-4" />
            Novo Autor
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Cargo</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="w-[120px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {autores && autores.length > 0 ? (
                  autores.map((autor) => (
                    <TableRow key={autor.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {autor.avatar_url ? (
                            <img
                              src={autor.avatar_url}
                              alt={autor.nome}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                              <User className="h-4 w-4 text-gray-500" />
                            </div>
                          )}
                          <span className="font-medium">{autor.nome}</span>
                        </div>
                      </TableCell>
                      <TableCell>{autor.cargo || "-"}</TableCell>
                      <TableCell>{autor.email || "-"}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditClick(autor)}
                          >
                            <Pencil className="h-4 w-4" />
                            <span className="sr-only">Editar</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-600 hover:text-red-900"
                            onClick={() => handleDeleteClick(autor)}
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Excluir</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-6 text-gray-500">
                      Nenhum autor encontrado
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Diálogo de criação/edição de autor */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {selectedAuthor ? "Editar Autor" : "Novo Autor"}
              </DialogTitle>
              <DialogDescription>
                {selectedAuthor
                  ? "Edite os detalhes do autor existente"
                  : "Adicione um novo autor ao portal de notícias"}
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {/* Nome */}
                <FormField
                  control={form.control}
                  name="nome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Nome do autor"
                          {...field}
                          onChange={(e) => {
                            field.onChange(e);
                            onNameChange(e);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Slug */}
                <FormField
                  control={form.control}
                  name="slug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Slug</FormLabel>
                      <FormControl>
                        <Input placeholder="url-amigavel" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Cargo */}
                <FormField
                  control={form.control}
                  name="cargo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cargo</FormLabel>
                      <FormControl>
                        <Input placeholder="Jornalista, Editor, etc" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Email */}
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input 
                          type="email" 
                          placeholder="email@exemplo.com" 
                          {...field} 
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Avatar */}
                <FormField
                  control={form.control}
                  name="avatar_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Avatar</FormLabel>
                      <div className="space-y-4">
                        {/* Campo escondido para mostrar o valor atual */}
                        <Input 
                          type="hidden" 
                          {...field} 
                          value={field.value || ""}
                        />

                        {/* Preview da imagem */}
                        {uploadedImage && (
                          <div className="flex items-center justify-center">
                            <div className="w-24 h-24 rounded-full overflow-hidden border border-gray-200">
                              <img 
                                src={uploadedImage.startsWith('http') ? uploadedImage : `${window.location.origin}${uploadedImage}`} 
                                alt="Avatar" 
                                className="w-full h-full object-cover"
                              />
                            </div>
                          </div>
                        )}

                        {/* Componente de upload */}
                        <div className="flex items-center gap-4">
                          <Button 
                            type="button" 
                            variant="outline" 
                            onClick={triggerFileInput}
                            disabled={isUploading}
                            className="flex items-center gap-2"
                          >
                            {isUploading ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Enviando...
                              </>
                            ) : (
                              <>
                                <Upload className="h-4 w-4" />
                                Fazer upload
                              </>
                            )}
                          </Button>

                          <div className="flex-1">
                            <Input
                              type="text"
                              placeholder="Ou insira a URL da imagem"
                              value={field.value || ""}
                              onChange={(e) => {
                                field.onChange(e.target.value);
                                setUploadedImage(e.target.value);
                              }}
                            />
                          </div>

                          {/* Input file escondido */}
                          <input 
                            ref={fileInputRef}
                            type="file" 
                            accept="image/*" 
                            onChange={handleImageUpload} 
                            className="hidden" 
                          />
                        </div>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Bio */}
                <FormField
                  control={form.control}
                  name="bio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Biografia</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Breve biografia do autor" 
                          className="h-24" 
                          {...field} 
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Twitter */}
                <FormField
                  control={form.control}
                  name="twitter_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Twitter</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="@usuariotwitter" 
                          {...field} 
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* LinkedIn */}
                <FormField
                  control={form.control}
                  name="linkedin_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>LinkedIn</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="URL do perfil no LinkedIn" 
                          {...field} 
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    disabled={saveMutation.isPending}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={saveMutation.isPending}>
                    {saveMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Salvando...
                      </>
                    ) : selectedAuthor ? (
                      "Atualizar"
                    ) : (
                      "Criar"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Diálogo de confirmação de exclusão */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar exclusão</DialogTitle>
              <DialogDescription>
                Tem certeza que deseja excluir o autor "{selectedAuthor?.nome}"? 
                Esta ação não pode ser desfeita e pode afetar notícias associadas a este autor.
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