"use client";

import { useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { Loader } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import AdminLayout from "@/layouts/AdminLayout";
import type { Video, Categoria, Autor } from "@/lib/api";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { TiptapEditor } from "@/components/TiptapEditor";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Schema para validação do formulário
const videoSchema = z.object({
  titulo: z.string().min(5, "O título precisa ter pelo menos 5 caracteres"),
  slug: z.string().min(5, "O slug precisa ter pelo menos 5 caracteres"),
  meta_descricao: z.string().min(10, "A descrição precisa ter pelo menos 10 caracteres"),
  conteudo: z.string().min(10, "O conteúdo precisa ter pelo menos 10 caracteres"),
  video_id: z.string().min(1, "O ID do vídeo é obrigatório"),
  plataforma: z.string().default("mux"),
  thumbnail_url: z.string().optional(),
  embed_url: z.string().optional(),
  duracao: z.number().min(0).default(0),
  autor_id: z.string().uuid("Selecione um autor válido"),
  categoria_id: z.string().uuid("Selecione uma categoria válida"),
  status: z.enum(["PUBLIC", "PRIVATE"]).default("PRIVATE"),
});

type FormValues = z.infer<typeof videoSchema>;

export default function CreateVideoPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, params] = useRoute("/admin/create-video/:id");
  const [_, navigate] = useLocation();
  const videoId = params?.id;

  // Buscar categorias para o select
  const { data: categorias = [] } = useQuery<Categoria[]>({
    queryKey: ["/api/categorias"],
  });

  // Buscar autores para o select
  const { data: autores = [] } = useQuery<Autor[]>({
    queryKey: ["/api/autores"],
  });

  // Buscar dados do vídeo se estiver editando
  const { data: video, isLoading } = useQuery<Video>({
    queryKey: [`/api/videos/${videoId}`],
    enabled: !!videoId,
    retry: 1,
  });

  // Inicializar formulário
  const form = useForm<FormValues>({
    resolver: zodResolver(videoSchema),
    defaultValues: {
      titulo: "",
      slug: "",
      meta_descricao: "",
      conteudo: "",
      video_id: "",
      plataforma: "mux",
      status: "PRIVATE",
      duracao: 0,
    },
  });

  // Carregar dados do vídeo no formulário quando disponível
  useEffect(() => {
    if (video) {
      form.reset({
        titulo: video.titulo,
        slug: video.slug,
        meta_descricao: video.meta_descricao || "",
        conteudo: video.conteudo || "",
        video_id: video.video_id,
        plataforma: video.plataforma,
        thumbnail_url: video.thumbnail_url || undefined,
        embed_url: video.embed_url || undefined,
        duracao: video.duracao || 0,
        autor_id: video.autor_id || undefined,
        categoria_id: video.categoria_id || undefined,
        status: video.status as "PUBLIC" | "PRIVATE",
      });
    }
  }, [video, form]);

  // Mutação para criar/atualizar vídeo
  const mutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const url = videoId ? `/api/videos/${videoId}` : "/api/videos";
      const method = videoId ? "PUT" : "POST";
      
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Erro ao salvar vídeo");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/videos"] });
      toast({
        title: "Sucesso",
        description: videoId ? "Vídeo atualizado com sucesso" : "Vídeo criado com sucesso",
      });
      navigate("/admin/manage-posts");
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao salvar vídeo",
        variant: "destructive",
      });
    },
  });

  // Gerar slug a partir do título
  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\w\s]/g, "")
      .replace(/\s+/g, "-");
  };

  // Handler para submissão do formulário
  const onSubmit = (data: FormValues) => {
    mutation.mutate(data);
  };

  // Se estiver carregando, mostrar indicador
  if (isLoading) {
    return (
      <AdminLayout title="Editar Vídeo">
        <div className="flex items-center justify-center h-64">
          <Loader className="h-10 w-10 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title={videoId ? "Editar Vídeo" : "Criar Vídeo"}>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <FormField
            control={form.control}
            name="titulo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Título</FormLabel>
                <FormControl>
                  <Input 
                    {...field} 
                    onChange={(e) => {
                      field.onChange(e);
                      if (!videoId) {
                        form.setValue("slug", generateSlug(e.target.value));
                      }
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="slug"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Slug</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="meta_descricao"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Descrição Curta (Meta)</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="conteudo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Conteúdo</FormLabel>
                <FormControl>
                  <TiptapEditor 
                    content={field.value}
                    onChange={field.onChange}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="video_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>ID do Vídeo (Mux)</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="autor_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Autor</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um autor" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {autores.map((autor) => (
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

          <FormField
            control={form.control}
            name="categoria_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Categoria</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma categoria" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categorias.map((categoria) => (
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
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="PUBLIC">Público</SelectItem>
                    <SelectItem value="PRIVATE">Privado</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button 
            type="submit" 
            disabled={mutation.isPending}
            className="w-full"
          >
            {mutation.isPending ? (
              <>
                <Loader className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              videoId ? "Atualizar Vídeo" : "Criar Vídeo"
            )}
          </Button>
        </form>
      </Form>
    </AdminLayout>
  );
} 