'use client';

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2, Trash2, Edit, Plus, Video, ExternalLink, Play, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { VideoCreateDialog } from "@/components/admin/videos/VideoCreateDialog";
import type { VideoType, Categoria, Autor } from "./types";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Schema de validação
const formSchema = z.object({
  titulo: z.string().min(1, "O título é obrigatório"),
  descricao: z.string().min(1, "A descrição é obrigatória"),
  transcricao: z.string().optional(),
  youtube_url: z.string().url("URL inválida").optional(),
  url_video: z.string().url("URL inválida").optional(),
  asset_id: z.string().optional(),
  playback_id: z.string().optional(),
  track_id: z.string().optional(),
  origem: z.string().optional(),
  status: z.enum(["PUBLIC", "PRIVATE"]),
  slug: z.string().optional(),
  thumbnail_url: z.string().url("URL inválida").optional()
});

type VideoFormValues = z.infer<typeof formSchema>;

// Componente para o formulário de vídeo
function VideoForm({
  video, 
  onSubmit, 
  isLoading,
  categorias,
  autores 
}: { 
  video?: VideoType; 
  onSubmit: (data: VideoFormValues) => void; 
  isLoading: boolean;
  categorias?: Categoria[];
  autores?: Autor[];
}) {
  const form = useForm<VideoFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      titulo: video?.titulo || "",
      descricao: video?.descricao || "",
      transcricao: video?.transcricao || "",
      youtube_url: video?.youtube_url || "",
      url_video: video?.url_video || "",
      asset_id: video?.asset_id || "",
      playback_id: video?.playback_id || "",
      track_id: video?.track_id || "",
      origem: video?.origem || "",
      status: video?.status || "PRIVATE",
      slug: video?.slug || "",
      thumbnail_url: video?.thumbnail_url || ""
    }
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="titulo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Título</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="descricao"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição</FormLabel>
              <FormControl>
                <Textarea {...field} />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <FormControl>
                <select
                  {...field}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                >
                  <option value="PRIVATE">Privado</option>
                  <option value="PUBLIC">Público</option>
                </select>
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="thumbnail_url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>URL da Thumbnail</FormLabel>
              <FormControl>
                <Input {...field} type="url" />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-4">
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Cancelar
            </Button>
          </DialogClose>
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar
          </Button>
        </div>
      </form>
    </Form>
  );
}

export function VideoManager() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selectedVideo, setSelectedVideo] = useState<VideoType | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const { data: videosData, isLoading } = useQuery({
    queryKey: ["videos"],
    queryFn: async () => {
      const response = await fetch("/api/videos");
      if (!response.ok) throw new Error("Erro ao carregar vídeos");
      const data = await response.json();
      return data;
    },
  });

  const { data: categorias } = useQuery({
    queryKey: ["categorias"],
    queryFn: async () => {
      const response = await fetch("/api/categorias");
      if (!response.ok) throw new Error("Erro ao carregar categorias");
      return response.json();
    },
  });

  const { data: autores } = useQuery({
    queryKey: ["autores"],
    queryFn: async () => {
      const response = await fetch("/api/autores");
      if (!response.ok) throw new Error("Erro ao carregar autores");
      return response.json();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (videoId: string) => {
      const response = await fetch(`/api/videos/${videoId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Erro ao excluir vídeo");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["videos"] });
      toast({
        title: "Vídeo excluído com sucesso!",
        variant: "default",
      });
      setIsDeleteDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Erro ao excluir vídeo",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleDelete = () => {
    if (selectedVideo && selectedVideo.id) {
      deleteMutation.mutate(selectedVideo.id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Verifica se não há vídeos
  const hasNoVideos = !videosData?.videos || videosData.videos.length === 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b pb-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Vídeos</h1>
          <p className="text-muted-foreground">
            Gerencie os vídeos da plataforma
          </p>
        </div>
        <VideoCreateDialog
          categories={videosData?.categories}
          open={isCreateDialogOpen}
          onOpenChange={(isOpen) => {
            setIsCreateDialogOpen(isOpen);
            if (!isOpen) {
              queryClient.invalidateQueries({ queryKey: ["videos"] });
            }
          }}
        />
      </div>

      {hasNoVideos ? (
        <div className="flex flex-col items-center justify-center h-64 space-y-4 bg-card dark:bg-card/95 rounded-lg border">
          <Video className="h-12 w-12 text-muted-foreground" />
          <div className="text-center">
            <h3 className="text-lg font-medium">Nenhum vídeo encontrado</h3>
            <p className="text-muted-foreground">
              Clique em "Novo vídeo" para adicionar seu primeiro vídeo.
            </p>
          </div>
        </div>
      ) : (
        <div className="rounded-md border bg-card dark:bg-card/95 shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent dark:border-border/50">
                <TableHead className="w-[100px] font-semibold">ID</TableHead>
                <TableHead className="font-semibold">Título</TableHead>
                <TableHead className="font-semibold">Categoria</TableHead>
                <TableHead className="font-semibold">Autor</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="text-right font-semibold">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {videosData?.videos?.map((video: VideoType) => (
                <TableRow 
                  key={video.id}
                  className={cn(
                    "cursor-pointer transition-colors border-border/50",
                    "hover:bg-muted/50 dark:hover:bg-muted/10",
                    selectedVideo?.id === video.id && "bg-muted/70 dark:bg-muted/20"
                  )}
                  onClick={() => setSelectedVideo(video)}
                >
                  <TableCell className="font-medium text-foreground/90">{video.id}</TableCell>
                  <TableCell className="text-foreground/90">{video.titulo}</TableCell>
                  <TableCell className="text-foreground/90">{video.categorias?.nome}</TableCell>
                  <TableCell className="text-foreground/90">{video.autores?.nome}</TableCell>
                  <TableCell>
                    <Badge variant={video.status === "PUBLIC" ? "default" : "secondary"}>
                      {video.status === "PUBLIC" ? "Público" : "Privado"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(`/videos/${video.slug}`, "_blank");
                        }}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedVideo(video);
                          setIsDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="dark:bg-card/95">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-semibold">Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground/90">
              Você tem certeza que deseja excluir o vídeo &quot;{selectedVideo?.titulo}&quot;? 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="dark:bg-muted/10 dark:hover:bg-muted/20 dark:text-foreground">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className={cn(
                "bg-destructive text-destructive-foreground",
                "hover:bg-destructive/90 dark:hover:bg-destructive/80",
                "dark:bg-destructive/90 dark:text-destructive-foreground"
              )}
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Excluindo...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Excluir vídeo
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 dark:bg-background/90">
          <div className="flex items-center space-x-2 text-muted-foreground dark:text-muted-foreground/90">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Carregando vídeos...</span>
          </div>
        </div>
      )}
    </div>
  );
} 