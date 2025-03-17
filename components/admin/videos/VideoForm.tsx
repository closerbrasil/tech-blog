'use client';

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Form, FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Loader2, Image as ImageIcon } from "lucide-react"
import type { VideoType, Categoria, Autor } from "./types"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Check, ChevronsUpDown } from "lucide-react"
import { Label } from "@/components/ui/label"

// Schema de validação
const formSchema = z.object({
  titulo: z.string().min(1, "O título é obrigatório"),
  descricao: z.string().min(1, "A descrição é obrigatória"),
  transcricao: z.string().optional(),
  youtube_url: z.string().url("URL inválida"),
  url_video: z.string().url("URL inválida"),
  asset_id: z.string(),
  playback_id: z.string(),
  track_id: z.string(),
  origem: z.string(),
  status: z.enum(["PUBLIC", "PRIVATE"]),
  slug: z.string(),
  thumbnail_url: z.string().url("URL inválida")
})

export type VideoFormValues = z.infer<typeof formSchema>

interface VideoFormProps {
  video?: VideoType
  onSubmit: (data: VideoFormValues) => void
  isLoading: boolean
  categorias?: Categoria[]
  autores?: Autor[]
  videoId?: string
}

export function VideoForm({ video, onSubmit, isLoading, categorias, autores, videoId }: VideoFormProps) {
  const [openCategoria, setOpenCategoria] = useState(false)
  const [openAutor, setOpenAutor] = useState(false)
  const [thumbnailPreview, setThumbnailPreview] = useState(video?.thumbnail_url || "")

  const form = useForm<z.infer<typeof formSchema>>({
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
  })

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value
    setThumbnailPreview(url)
    form.setValue("thumbnail_url", url)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid gap-4">
            <FormField
              control={form.control}
              name="titulo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Ex: Como criar uma API REST com Node.js" 
                      className={cn(
                        "dark:bg-background transition-colors",
                        "focus:ring-2 focus:ring-primary/20",
                        form.formState.errors.titulo && "border-red-500 dark:border-red-500"
                      )}
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    O título que será exibido para os usuários
                  </FormDescription>
                  <FormMessage />
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
                  <Textarea 
                    placeholder="Descreva o conteúdo do vídeo..."
                    className={cn(
                      "dark:bg-background min-h-[120px] resize-none",
                      "focus:ring-2 focus:ring-primary/20",
                      form.formState.errors.descricao && "border-red-500 dark:border-red-500"
                    )}
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Uma breve descrição do conteúdo do vídeo
                </FormDescription>
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
                <FormControl>
                  <select
                    {...field}
                    className="w-full rounded-md border border-input bg-background px-3 py-2"
                  >
                    <option value="PRIVATE">Privado</option>
                    <option value="PUBLIC">Público</option>
                  </select>
                </FormControl>
                <FormDescription>
                  Define se o vídeo será público ou privado
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="youtube_url"
            render={({ field }) => (
              <FormItem>
                <FormLabel>URL do YouTube</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="https://www.youtube.com/watch?v=VIDEO_ID"
                    className={cn(
                      "dark:bg-background transition-colors",
                      "focus:ring-2 focus:ring-primary/20",
                      form.formState.errors.youtube_url && "border-red-500 dark:border-red-500"
                    )}
                    {...field} 
                  />
                </FormControl>
                <FormDescription>
                  URL do vídeo no YouTube
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="url_video"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL do Vídeo (Mux)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="https://stream.mux.com/VIDEO_ID/video.mp4"
                      className={cn(
                        "dark:bg-background transition-colors",
                        "focus:ring-2 focus:ring-primary/20",
                      form.formState.errors.url_video && "border-red-500 dark:border-red-500"
                      )}
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    URL do vídeo no formato Mux
                  </FormDescription>
                  <FormMessage />
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
                    <div className="space-y-4">
                      <Input 
                        placeholder="https://exemplo.com/thumbnail.jpg"
                        className={cn(
                          "dark:bg-background transition-colors",
                          "focus:ring-2 focus:ring-primary/20",
                        form.formState.errors.thumbnail_url && "border-red-500 dark:border-red-500"
                        )}
                        onChange={handleThumbnailChange}
                        value={field.value}
                      />
                      {thumbnailPreview ? (
                        <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-border">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img 
                            src={thumbnailPreview} 
                            alt="Preview da thumbnail"
                            className="object-cover w-full h-full"
                            onError={() => setThumbnailPreview("")}
                          />
                        </div>
                      ) : (
                        <div className="flex items-center justify-center aspect-video w-full rounded-lg border border-dashed border-border bg-muted/20">
                          <div className="text-center">
                            <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground/50" />
                            <p className="mt-2 text-sm text-muted-foreground">
                              Preview da thumbnail
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </FormControl>
                  <FormDescription>
                  URL da imagem de capa do vídeo
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

        <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              "Salvar"
            )}
          </Button>
      </form>
    </Form>
  );
} 