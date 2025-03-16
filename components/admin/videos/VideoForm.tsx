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

// Schema de validação
const formSchema = z.object({
  titulo: z.string().min(3, "O título deve ter no mínimo 3 caracteres"),
  descricao: z.string().min(10, "A descrição deve ter no mínimo 10 caracteres"),
  url: z.string().url("URL inválida do vídeo"),
  thumbnail: z.string().url("URL inválida da thumbnail"),
  duracao: z.number().min(1, "A duração deve ser maior que 0"),
  visibilidade: z.enum(["PUBLICO", "PRIVADO", "ASSINANTES"]),
  categoria_id: z.string().min(1, "Selecione uma categoria"),
  autor_id: z.string().min(1, "Selecione um autor"),
  videoId: z.string().optional(),
  thumbnailUrl: z.string().optional(),
  status: z.enum(["draft", "published"]).default("draft"),
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
  const [thumbnailPreview, setThumbnailPreview] = useState(video?.thumbnail || "")

  const isValidVisibilidade = (value: string | undefined): value is "PUBLICO" | "PRIVADO" | "ASSINANTES" => {
    return value ? ["PUBLICO", "PRIVADO", "ASSINANTES"].includes(value) : false;
  };

  const form = useForm<VideoFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      titulo: video?.titulo || "",
      descricao: video?.descricao || "",
      url: video?.url || "",
      thumbnail: video?.thumbnail || "",
      duracao: video?.duracao || 0,
      visibilidade: isValidVisibilidade(video?.visibilidade) ? video.visibilidade : "PUBLICO",
      categoria_id: video?.categoria_id || "",
      autor_id: video?.autor_id || "",
      videoId: videoId,
      status: video?.status || "draft",
    }
  })

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value
    setThumbnailPreview(url)
    form.setValue("thumbnail", url)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Coluna da esquerda */}
          <div className="space-y-6">
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
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL do Vídeo (Mux)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="https://stream.mux.com/VIDEO_ID/video.mp4"
                      className={cn(
                        "dark:bg-background transition-colors",
                        "focus:ring-2 focus:ring-primary/20",
                        form.formState.errors.url && "border-red-500 dark:border-red-500"
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
              name="thumbnail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Thumbnail</FormLabel>
                  <FormControl>
                    <div className="space-y-4">
                      <Input 
                        placeholder="https://exemplo.com/thumbnail.jpg"
                        className={cn(
                          "dark:bg-background transition-colors",
                          "focus:ring-2 focus:ring-primary/20",
                          form.formState.errors.thumbnail && "border-red-500 dark:border-red-500"
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
                    URL da imagem de preview do vídeo
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Coluna da direita */}
          <div className="space-y-6">
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
              name="categoria_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoria</FormLabel>
                  <Popover open={openCategoria} onOpenChange={setOpenCategoria}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={openCategoria}
                          className={cn(
                            "w-full justify-between dark:bg-background",
                            "focus:ring-2 focus:ring-primary/20",
                            !field.value && "text-muted-foreground",
                            form.formState.errors.categoria_id && "border-red-500 dark:border-red-500"
                          )}
                        >
                          {field.value
                            ? categorias?.find((categoria) => categoria.id === field.value)?.nome
                            : "Selecione uma categoria"}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Buscar categoria..." />
                        <CommandEmpty>Nenhuma categoria encontrada</CommandEmpty>
                        <CommandGroup>
                          <ScrollArea className="h-48">
                            {categorias?.map((categoria) => (
                              <CommandItem
                                key={categoria.id}
                                value={categoria.nome}
                                onSelect={() => {
                                  form.setValue("categoria_id", categoria.id)
                                  setOpenCategoria(false)
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    categoria.id === field.value ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {categoria.nome}
                              </CommandItem>
                            ))}
                          </ScrollArea>
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormDescription>
                    Selecione a categoria do vídeo
                  </FormDescription>
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
                  <Popover open={openAutor} onOpenChange={setOpenAutor}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={openAutor}
                          className={cn(
                            "w-full justify-between dark:bg-background",
                            "focus:ring-2 focus:ring-primary/20",
                            !field.value && "text-muted-foreground",
                            form.formState.errors.autor_id && "border-red-500 dark:border-red-500"
                          )}
                        >
                          {field.value
                            ? autores?.find((autor) => autor.id === field.value)?.nome
                            : "Selecione um autor"}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Buscar autor..." />
                        <CommandEmpty>Nenhum autor encontrado</CommandEmpty>
                        <CommandGroup>
                          <ScrollArea className="h-48">
                            {autores?.map((autor) => (
                              <CommandItem
                                key={autor.id}
                                value={autor.nome}
                                onSelect={() => {
                                  form.setValue("autor_id", autor.id)
                                  setOpenAutor(false)
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    autor.id === field.value ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {autor.nome}
                              </CommandItem>
                            ))}
                          </ScrollArea>
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormDescription>
                    Selecione o autor do vídeo
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="visibilidade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Visibilidade</FormLabel>
                    <FormControl>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger 
                            className={cn(
                              "dark:bg-background",
                              "focus:ring-2 focus:ring-primary/20",
                              form.formState.errors.visibilidade && "border-red-500 dark:border-red-500"
                            )}
                          >
                            <SelectValue placeholder="Selecione a visibilidade" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="PUBLICO">Público</SelectItem>
                          <SelectItem value="PRIVADO">Privado</SelectItem>
                          <SelectItem value="ASSINANTES">Assinantes</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="duracao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duração (minutos)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number"
                        min="1"
                        step="1"
                        placeholder="Ex: 60"
                        className={cn(
                          "dark:bg-background",
                          "focus:ring-2 focus:ring-primary/20",
                          form.formState.errors.duracao && "border-red-500 dark:border-red-500"
                        )}
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-4 pt-4 border-t">
          <Button 
            type="submit" 
            disabled={isLoading || !form.formState.isDirty} 
            className={cn(
              "dark:hover:bg-primary/20",
              "transition-colors",
              isLoading && "opacity-70"
            )}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              "Salvar"
            )}
          </Button>
        </div>
      </form>
    </Form>
  )
} 