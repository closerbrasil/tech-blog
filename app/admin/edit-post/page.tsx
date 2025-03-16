import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { TiptapEditor } from "@/components/TiptapEditor";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import AdminLayout from "@/layouts/AdminLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Loader2, 
  Upload, 
  X, 
  PlusCircle, 
  Tag as TagIcon,
  ArrowLeft,
  Eye,
  Save,
  Settings2
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger 
} from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { apiRequest } from "@/lib/queryClient";
import type { Noticia, Categoria, Autor, Tag } from "@shared/schema";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";

// Schema para o formulário de edição
const editPostSchema = z.object({
  titulo: z.string().min(5, "O título precisa ter pelo menos 5 caracteres"),
  slug: z.string().min(5, "O slug precisa ter pelo menos 5 caracteres"),
  metaDescricao: z.string().min(10, "A descrição precisa ter pelo menos 10 caracteres"),
  conteudo: z.string().min(10, "O conteúdo precisa ter pelo menos 10 caracteres"),
  imageUrl: z.string().optional(),
  autorId: z.string().uuid("Selecione um autor válido"),
  categoriaId: z.string().uuid("Selecione uma categoria válida"),
  status: z.enum(["rascunho", "publicado", "agendado"]),
  visibilidade: z.enum(["publico", "assinantes", "privado"]),
  schemaType: z.enum(["Article", "NewsArticle", "BlogPosting"]),
  tempoLeitura: z.string().optional(),
});

type FormValues = z.infer<typeof editPostSchema>;

export default function EditPostPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  const [, params] = useRoute("/admin/edit-post/:id");
  const postId = params?.id;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [openTagsPopover, setOpenTagsPopover] = useState(false);

  // Buscar o artigo para edição
  const { data: noticia, isLoading: loadingNoticia } = useQuery<Noticia>({
    queryKey: [`/api/noticias/${postId}`],
    enabled: !!postId,
    retry: false,
    queryFn: async () => {
      const res = await fetch(`/api/noticias/${postId}`);
      if (!res.ok) {
        toast({
          title: "Erro",
          description: "Não foi possível carregar a notícia",
          variant: "destructive",
        });
        navigate("/admin/manage-posts");
        throw new Error("Falha ao carregar notícia");
      }
      return res.json();
    }
  });

  // Buscar categorias para o select
  const { data: categorias, isLoading: loadingCategorias } = useQuery<Categoria[]>({
    queryKey: ["/api/categorias"],
  });

  // Buscar autores para o select
  const { data: autores, isLoading: loadingAutores } = useQuery<Autor[]>({
    queryKey: ["/api/autores"],
  });

  // Buscar tags associadas à notícia
  const { data: noticiaTags } = useQuery<Tag[]>({
    queryKey: [`/api/noticias/${postId}/tags`],
    enabled: !!postId,
  });
  
  // Buscar todas as tags disponíveis
  const { data: allTags, isLoading: loadingTags } = useQuery<Tag[]>({
    queryKey: ["/api/tags"],
  });

  // Inicializar o formulário
  const form = useForm<FormValues>({
    resolver: zodResolver(editPostSchema),
    defaultValues: {
      titulo: "",
      slug: "",
      metaDescricao: "",
      conteudo: "",
      imageUrl: "",
      autorId: "",
      categoriaId: "",
      status: "publicado",
      visibilidade: "publico",
      schemaType: "Article",
      tempoLeitura: "5 min",
    },
  });

  // Atualizar valores do formulário quando a notícia é carregada
  useEffect(() => {
    if (noticia && "titulo" in noticia) {
      const noticiaData = noticia as unknown as {
        titulo: string;
        slug: string;
        metaDescricao?: string;
        conteudo: string;
        imageUrl?: string;
        autorId: string;
        categoriaId: string;
        status: string; 
        visibilidade: string;
        schemaType: string;
        tempoLeitura?: string;
      };
      
      form.reset({
        titulo: noticiaData.titulo,
        slug: noticiaData.slug,
        metaDescricao: noticiaData.metaDescricao || "",
        conteudo: noticiaData.conteudo,
        imageUrl: noticiaData.imageUrl || "",
        autorId: noticiaData.autorId,
        categoriaId: noticiaData.categoriaId,
        status: noticiaData.status as "rascunho" | "publicado" | "agendado", 
        visibilidade: noticiaData.visibilidade as "publico" | "assinantes" | "privado",
        schemaType: noticiaData.schemaType as "Article" | "NewsArticle" | "BlogPosting",
        tempoLeitura: noticiaData.tempoLeitura || "5 min",
      });
      
      if (noticiaData.imageUrl) {
        setUploadedImage(noticiaData.imageUrl);
      }
    }
  }, [noticia, form]);

  // Gerar slug a partir do título
  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\w\s]/g, "")
      .replace(/\s+/g, "-");
  };

  // Mutação para atualizar a notícia
  const updateMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const res = await fetch(`/api/noticias/${postId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          schemaType: data.schemaType // Garantindo que o schemaType seja enviado
        }),
      });
      if (!res.ok) throw new Error("Falha ao atualizar notícia");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/noticias"] });
      queryClient.invalidateQueries({ queryKey: [`/api/noticias/${postId}`] });
      
      toast({
        title: "Sucesso",
        description: "Conteúdo atualizado com sucesso",
      });
      
      navigate("/admin/manage-posts");
    },
    onError: (error) => {
      setIsSubmitting(false);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Ocorreu um erro desconhecido",
        variant: "destructive",
      });
    }
  });

  // Upload de imagem
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('image', file);
      
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!res.ok) {
        throw new Error('Falha ao fazer upload da imagem');
      }
      
      const data = await res.json();
      setUploadedImage(data.imageUrl);
      form.setValue('imageUrl', data.imageUrl);
    } catch (error) {
      toast({
        title: 'Erro no upload',
        description: error instanceof Error ? error.message : 'Ocorreu um erro ao fazer upload da imagem',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // Atualizar o slug quando o título mudar
  const onTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    const currentSlug = form.getValues('slug');
    
    // Só atualiza o slug automaticamente se estiver vazio ou se o usuário não o tiver editado manualmente
    if (!currentSlug || currentSlug === generateSlug(form.getValues('titulo'))) {
      form.setValue('slug', generateSlug(title));
    }
  };

  // Submeter o formulário
  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      await updateMutation.mutateAsync(values);
      await updateNoticiaTagsIfChanged();
    } catch (error) {
      console.error('Erro ao atualizar notícia:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Effect para adicionar as tags da notícia ao carregar
  useEffect(() => {
    if (noticiaTags && noticiaTags.length > 0) {
      setSelectedTags(noticiaTags);
    }
  }, [noticiaTags]);

  // Métodos para gerenciar as tags
  const handleSelectTag = (tag: Tag) => {
    // Verifica se a tag já foi selecionada
    if (!selectedTags.some((t) => t.id === tag.id)) {
      setSelectedTags([...selectedTags, tag]);
      setOpenTagsPopover(false);
    }
  };

  const handleRemoveTag = (tag: Tag) => {
    setSelectedTags(selectedTags.filter((t) => t.id !== tag.id));
  };

  // Mutation para adicionar tag a uma notícia
  const addTagMutation = useMutation({
    mutationFn: async ({ tagId }: { tagId: string }) => {
      return apiRequest('POST', `/api/noticias/${postId}/tags`, { tagId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/noticias/${postId}/tags`] });
    },
    onError: (error) => {
      console.error('Erro ao adicionar tag:', error);
      toast({
        title: 'Erro ao adicionar tag',
        description: 'Não foi possível adicionar a tag à notícia',
        variant: 'destructive',
      });
    },
  });

  // Mutation para criar nova tag
  const createTagMutation = useMutation({
    mutationFn: async (tagName: string) => {
      return apiRequest('POST', '/api/tags', { 
        nome: tagName,
        slug: tagName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\w\s]/g, "").replace(/\s+/g, "-")
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tags"] });
    },
    onError: (error) => {
      console.error('Erro ao criar tag:', error);
      toast({
        title: 'Erro ao criar tag',
        description: 'Não foi possível criar a nova tag',
        variant: 'destructive',
      });
    },
  });

  // Função para criar nova tag e selecioná-la
  const createTagAndSelect = async (tagName: string) => {
    try {
      const response = await createTagMutation.mutateAsync(tagName);
      // Adicionar a nova tag à lista de selecionadas
      if (response && 'id' in response) {
        // Gerar um slug caso a API não retorne
        const slug = ('slug' in response && response.slug) 
          ? response.slug 
          : tagName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\w\s]/g, "").replace(/\s+/g, "-");
        
        const newTag = {
          id: response.id,
          nome: tagName,
          slug: slug,
        };
        
        handleSelectTag(newTag as Tag);
        
        toast({
          title: 'Tag criada com sucesso',
          description: `A tag "${tagName}" foi criada e adicionada ao artigo.`,
        });
      }
    } catch (error) {
      console.error('Erro ao criar e selecionar tag:', error);
    }
  };

  // Mutation para remover tag de uma notícia
  const removeTagMutation = useMutation({
    mutationFn: async ({ tagId }: { tagId: string }) => {
      return apiRequest('DELETE', `/api/noticias/${postId}/tags/${tagId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/noticias/${postId}/tags`] });
    },
    onError: (error) => {
      console.error('Erro ao remover tag:', error);
      toast({
        title: 'Erro ao remover tag',
        description: 'Não foi possível remover a tag da notícia',
        variant: 'destructive',
      });
    },
  });

  // Gerenciar tags após atualização da notícia
  const updateNoticiaTagsIfChanged = async () => {
    if (!noticiaTags) return;
    
    // Obter IDs das tags atuais da notícia
    const existingTagIds = noticiaTags.map(tag => tag.id);
    
    // Tags para adicionar (estão em selectedTags mas não em existingTagIds)
    const tagsToAdd = selectedTags.filter(tag => !existingTagIds.includes(tag.id));
    
    // Tags para remover (estão em existingTagIds mas não em selectedTags)
    const selectedTagIds = selectedTags.map(tag => tag.id);
    const tagsToRemove = noticiaTags.filter(tag => !selectedTagIds.includes(tag.id));
    
    // Adicionar novas tags
    const addPromises = tagsToAdd.map(tag => 
      addTagMutation.mutateAsync({ tagId: tag.id })
    );
    
    // Remover tags que não estão mais selecionadas
    const removePromises = tagsToRemove.map(tag =>
      removeTagMutation.mutateAsync({ tagId: tag.id })
    );
    
    try {
      // Executa todas as operações em paralelo
      await Promise.all([...addPromises, ...removePromises]);
      
      if (tagsToAdd.length > 0 || tagsToRemove.length > 0) {
        toast({
          title: 'Tags atualizadas',
          description: 'As tags da notícia foram atualizadas com sucesso',
        });
      }
    } catch (error) {
      console.error('Erro ao atualizar tags:', error);
      toast({
        title: 'Erro ao atualizar tags',
        description: 'Ocorreu um erro ao atualizar as tags da notícia',
        variant: 'destructive',
      });
    }
  };

  // Verificar se está carregando dados iniciais
  const isLoading = loadingNoticia || loadingCategorias || loadingAutores || loadingTags;

  if (isLoading) {
    return (
      <AdminLayout title="Editar Notícia">
        <div className="space-y-6">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <>
      <SEOHead
        title="Editar Notícia | Admin"
        description="Edite um artigo existente no portal de notícias"
      />

      <AdminLayout title="Editar Notícia">
        <Form {...form}>
          <div className="flex flex-col h-screen overflow-hidden">
            {/* Header bar com botões e título */}
            <div className="flex items-center justify-between h-14 px-4 border-b z-10">
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => navigate("/admin/manage-posts")}
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <FormField
                  control={form.control}
                  name="titulo"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormControl>
                        <Input 
                          placeholder="Título da notícia" 
                          className="text-xl font-semibold border-0 focus-visible:ring-0 w-[600px] h-10 p-0"
                          {...field} 
                          onChange={(e) => {
                            field.onChange(e);
                            onTitleChange(e);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="flex items-center gap-2">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Settings2 className="h-4 w-4 mr-2" />
                      Configurações
                    </Button>
                  </SheetTrigger>
                  <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
                    <div className="space-y-6 py-6">
                      {/* SEO Section */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold">SEO</h3>
                        <FormField
                          control={form.control}
                          name="slug"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>URL</FormLabel>
                              <FormControl>
                                <div className="flex items-center gap-2">
                                  <span className="text-muted-foreground">closerbrasil.com.br/</span>
                                  <Input {...field} />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="metaDescricao"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Meta Descrição</FormLabel>
                              <FormControl>
                                <Textarea
                                  {...field}
                                  placeholder="Descrição que aparecerá nos resultados de busca"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <Separator />

                      {/* Imagem em destaque - Movida da sidebar */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Imagem em destaque</h3>
                        <FormField
                          control={form.control}
                          name="imageUrl"
                          render={({ field }) => (
                            <FormItem>
                              <div className="space-y-3">
                                <Input type="hidden" {...field} />
                                
                                {uploadedImage && (
                                  <div className="relative aspect-video rounded-md overflow-hidden border">
                                    <img 
                                      src={uploadedImage} 
                                      alt="Preview" 
                                      className="w-full h-full object-cover"
                                    />
                                    <Button
                                      variant="destructive"
                                      size="icon"
                                      className="absolute top-2 right-2 h-7 w-7 rounded-full"
                                      onClick={() => {
                                        setUploadedImage(null);
                                        field.onChange('');
                                      }}
                                    >
                                      <X className="h-3.5 w-3.5" />
                                    </Button>
                                  </div>
                                )}

                                <div className="flex flex-col gap-2">
                                  <Button 
                                    type="button" 
                                    variant="outline" 
                                    onClick={triggerFileInput}
                                    disabled={isUploading}
                                    className="w-full"
                                    size="sm"
                                  >
                                    {isUploading ? (
                                      <>
                                        <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />
                                        Enviando...
                                      </>
                                    ) : (
                                      <>
                                        <Upload className="h-3.5 w-3.5 mr-2" />
                                        Upload
                                      </>
                                    )}
                                  </Button>

                                  <Input
                                    type="text"
                                    placeholder="Ou insira a URL da imagem"
                                    value={field.value || ""}
                                    onChange={(e) => {
                                      field.onChange(e.target.value);
                                      setUploadedImage(e.target.value);
                                    }}
                                    className="h-9 text-sm"
                                  />
                                </div>

                                <input 
                                  ref={fileInputRef}
                                  type="file" 
                                  accept="image/*" 
                                  onChange={handleImageUpload} 
                                  className="hidden" 
                                />
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <Separator />

                      {/* Tags - Movidas da sidebar */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Tags</h3>
                        <div className="space-y-2">
                          <div className="flex flex-wrap gap-1.5 min-h-[2.5rem] p-2 border rounded-md">
                            {selectedTags.length === 0 ? (
                              <span className="text-xs text-muted-foreground">
                                Adicione tags para melhor categorização
                              </span>
                            ) : (
                              selectedTags.map((tag) => (
                                <Badge 
                                  key={tag.id} 
                                  variant="secondary"
                                  className="flex items-center gap-1 text-xs py-1"
                                >
                                  {tag.nome}
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveTag(tag)}
                                    className="ml-1 hover:text-destructive"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </Badge>
                              ))
                            )}
                          </div>
                          <Popover open={openTagsPopover} onOpenChange={setOpenTagsPopover}>
                            <PopoverTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="mt-1 h-8 text-xs"
                              >
                                <PlusCircle className="h-3.5 w-3.5 mr-1.5" />
                                Adicionar Tag
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-64 p-0" side="left">
                              <Command>
                                <CommandInput 
                                  placeholder="Buscar ou criar tag..."
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' && e.currentTarget.value.trim() !== '') {
                                      e.preventDefault();
                                      const tagName = e.currentTarget.value.trim();
                                      const tagExists = allTags?.some(
                                        (tag) => tag.nome.toLowerCase() === tagName.toLowerCase()
                                      );
                                      
                                      if (!tagExists) {
                                        createTagAndSelect(tagName);
                                      } else {
                                        const existingTag = allTags?.find(
                                          (tag) => tag.nome.toLowerCase() === tagName.toLowerCase()
                                        );
                                        if (existingTag) {
                                          handleSelectTag(existingTag);
                                        }
                                      }
                                      e.currentTarget.value = '';
                                      setOpenTagsPopover(false);
                                    }
                                  }}
                                />
                                <CommandEmpty>
                                  Nenhuma tag encontrada. Pressione Enter para criar.
                                </CommandEmpty>
                                <CommandGroup className="max-h-60 overflow-auto">
                                  {allTags?.map((tag) => (
                                    <CommandItem
                                      key={tag.id}
                                      onSelect={() => handleSelectTag(tag)}
                                      className="flex items-center"
                                    >
                                      <TagIcon className="mr-2 h-3.5 w-3.5" />
                                      <span className="text-sm">{tag.nome}</span>
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </Command>
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>

                      <Separator />

                      {/* Categorização */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Categorização</h3>
                        <FormField
                          control={form.control}
                          name="categoriaId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Categoria Principal</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecione uma categoria" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {categorias?.map((categoria) => (
                                    <SelectItem key={categoria.id} value={categoria.id}>
                                      {categoria.nome}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="autorId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Autor</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecione o autor" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {autores?.map((autor) => (
                                    <SelectItem key={autor.id} value={autor.id}>
                                      {autor.nome}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <Separator />

                      {/* Configurações de Publicação */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Configurações de Publicação</h3>
                        <FormField
                          control={form.control}
                          name="status"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Status</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecione o status" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="rascunho">Rascunho</SelectItem>
                                  <SelectItem value="publicado">Publicado</SelectItem>
                                  <SelectItem value="agendado">Agendado</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="visibilidade"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Visibilidade</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecione a visibilidade" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="publico">Público</SelectItem>
                                  <SelectItem value="assinantes">Assinantes</SelectItem>
                                  <SelectItem value="privado">Privado</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <Separator />

                      {/* Configurações Avançadas */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Configurações Avançadas</h3>
                        <FormField
                          control={form.control}
                          name="schemaType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Tipo de Schema</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecione o tipo" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="Article">Artigo</SelectItem>
                                  <SelectItem value="NewsArticle">Notícia</SelectItem>
                                  <SelectItem value="BlogPosting">Post de Blog</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormDescription>
                                Escolha "NewsArticle" para indexação no Google News (válido por 2 dias)
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="tempoLeitura"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Tempo de Leitura</FormLabel>
                              <FormControl>
                                <Input placeholder="Ex: 5 min" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>

                <Button variant="outline" size="sm">
                  <Eye className="h-4 w-4 mr-2" />
                  Visualizar
                </Button>

                <Button 
                  onClick={form.handleSubmit(onSubmit)}
                  disabled={isSubmitting}
                  size="sm"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Publicar
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Área principal - agora com editor em tela cheia */}
            <div className="h-[calc(100vh-3.5rem)] overflow-hidden">
              {/* Área de edição em tela cheia */}
              <div className="flex flex-col items-center h-full w-full">
                <div className="w-full max-w-[1000px] mx-auto flex flex-col h-full">
                  <FormField
                    control={form.control}
                    name="conteudo"
                    render={({ field }) => (
                      <FormItem className="h-full p-0 m-0 flex-1">
                        <FormControl>
                          <div className="flex flex-col h-full">
                            {/* Toolbar */}
                            <div className="border border-slate-200 border-b-0 rounded-t-md bg-slate-50">
                              {/* TipTap toolbar (simulado) */}
                              <div className="flex items-center p-2">
                                <div className="flex items-center space-x-1">
                                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-md">
                                    <span className="sr-only">Bold</span>
                                    <span className="font-bold text-sm">B</span>
                                  </Button>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-md">
                                    <span className="sr-only">Italic</span>
                                    <span className="italic text-sm">I</span>
                                  </Button>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-md">
                                    <span className="sr-only">Underline</span>
                                    <span className="underline text-sm">U</span>
                                  </Button>
                                </div>
                              </div>
                            </div>

                            {/* Editor area */}
                            <div className="flex-1 border border-slate-200 rounded-b-md overflow-hidden">
                              <TiptapEditor
                                content={field.value}
                                onChange={field.onChange}
                                placeholder="Comece a escrever seu conteúdo..."
                                editorClassName="h-full w-full overflow-y-auto px-4 py-3"
                              />
                            </div>
                          </div>
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>
          </div>
        </Form>
      </AdminLayout>
    </>
  );
}