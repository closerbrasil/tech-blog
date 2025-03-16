'use client';

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Loader2 } from "lucide-react";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { VideoForm } from "./VideoForm";
import { MuxVideoUploader } from "./MuxVideoUploader";
import type { VideoFormValues } from "./types";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface VideoCreateDialogProps {
  isOpen: boolean;
  onClose: (isOpen: boolean) => void;
}

interface FormData {
  categorias: Array<{
    id: string;
    nome: string;
  }>;
  autores: Array<{
    id: string;
    nome: string;
  }>;
}

export function VideoCreateDialog({ isOpen, onClose }: VideoCreateDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [videoId, setVideoId] = useState<string>("");
  const [assetId, setAssetId] = useState<string>("");
  const [form, setForm] = useState({
    titulo: "",
    descricao: "",
    categoria_id: "",
    autor_id: "",
    visibilidade: "PUBLICO",
    conteudo: "",
    meta_descricao: "",
    slug: "",
    status: "POSTED",
    recursos: "[]",
    capitulos: "[]",
    plataforma: "mux"
  });

  // Buscar dados do formulário usando React Query
  const { data: formData, isLoading: isLoadingFormData } = useQuery<FormData>({
    queryKey: ['formData'],
    queryFn: async () => {
      const response = await fetch("/api/videos/get-form-data");
      if (!response.ok) {
        throw new Error("Erro ao carregar dados do formulário");
      }
      const data = await response.json();
      return data;
    },
    enabled: isOpen,
  });

  const handleInputChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!videoId || !assetId) {
      toast({
        title: "Erro",
        description: "É necessário fazer o upload do vídeo primeiro",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);

      // Gerar slug a partir do título
      const slug = form.titulo
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      
      const requestData = {
        ...form,
        video_id: videoId,
        asset_id: assetId,
        slug,
        meta_descricao: form.descricao,
        conteudo: form.descricao,
      };

      const response = await fetch("/api/videos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });

      const responseData = await response.json();

      if (!response.ok) throw new Error(`Erro ao criar vídeo: ${responseData.error || responseData.details || 'Erro desconhecido'}`);

      toast({
        title: "Sucesso",
        description: "Vídeo criado com sucesso",
      });
      onClose(false);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível criar o vídeo",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingFormData) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[600px]">
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Carregando...</span>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      <Button 
        className={cn(
          "dark:hover:bg-primary/20",
          "transition-colors"
        )}
        onClick={() => onClose(!isOpen)}
      >
        <Plus className="mr-2 h-4 w-4" />
        Novo vídeo
      </Button>

      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent 
          className="sm:max-w-[600px]"
          onInteractOutside={(e) => {
            if (isLoading) {
              e.preventDefault();
            }
          }}
          onEscapeKeyDown={(e) => {
            if (isLoading) {
              e.preventDefault();
            }
          }}
        >
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">Criar novo vídeo</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Primeiro faça o upload do vídeo, depois preencha os detalhes.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Botão para teste da API */}
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={async () => {
                  try {
                    const response = await fetch("/api/videos/test-connection", {
                      method: "GET",
                    });
                    const data = await response.json();
                    toast({
                      title: "Resultado do teste",
                      description: `Conexão com o banco: ${data.dbConnected ? "OK" : "Falha"}`,
                    });
                  } catch (error) {
                    toast({
                      title: "Erro no teste",
                      description: "Erro ao testar conexão com o banco",
                      variant: "destructive",
                    });
                  }
                }}
              >
                Testar Conexão
              </Button>
              
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={async () => {
                  try {
                    const response = await fetch("/api/videos/create-schema", {
                      method: "POST",
                    });
                    const data = await response.json();
                    console.log("Criação de esquema:", data);
                    toast({
                      title: data.success ? "Sucesso" : "Erro",
                      description: data.message,
                      variant: data.success ? "default" : "destructive",
                    });
                  } catch (error) {
                    console.error("Erro ao criar esquema:", error);
                    toast({
                      title: "Erro ao criar esquema",
                      description: "Verifique o console para detalhes",
                      variant: "destructive",
                    });
                  }
                }}
              >
                Criar Esquema
              </Button>
            </div>
            
            {!videoId && (
              <div className="space-y-4">
                <MuxVideoUploader
                  onUploadComplete={(playbackId: string, muxAssetId: string) => {
                    setVideoId(playbackId);
                    setAssetId(muxAssetId);
                  }}
                />
              </div>
            )}

            {videoId && (
              <div className="max-h-[80vh] overflow-y-auto">
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="titulo">Título</Label>
                    <Input
                      id="titulo"
                      value={form.titulo}
                      onChange={(e) => handleInputChange("titulo", e.target.value)}
                      placeholder="Digite o título do vídeo"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="descricao">Descrição</Label>
                    <Textarea
                      id="descricao"
                      value={form.descricao}
                      onChange={(e) => handleInputChange("descricao", e.target.value)}
                      placeholder="Digite a descrição do vídeo"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="categoria">Categoria</Label>
                    <Select
                      value={form.categoria_id}
                      onValueChange={(value) => handleInputChange("categoria_id", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        {formData?.categorias?.map((categoria) => (
                          <SelectItem key={categoria.id} value={categoria.id}>
                            {categoria.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="autor">Autor</Label>
                    <Select
                      value={form.autor_id}
                      onValueChange={(value) => handleInputChange("autor_id", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um autor" />
                      </SelectTrigger>
                      <SelectContent>
                        {formData?.autores?.map((autor) => (
                          <SelectItem key={autor.id} value={autor.id}>
                            {autor.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="visibilidade">Visibilidade</Label>
                    <Select
                      value={form.visibilidade}
                      onValueChange={(value) => handleInputChange("visibilidade", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a visibilidade" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PUBLICO">Público</SelectItem>
                        <SelectItem value="PRIVADO">Privado</SelectItem>
                        <SelectItem value="ASSINANTES">Assinantes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}
          </div>

          {isLoading && (
            <div className="absolute inset-0 bg-background/80 flex items-center justify-center rounded-lg">
              <div className="flex items-center space-x-2">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <p className="text-sm font-medium">Criando vídeo...</p>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => onClose(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando...
                </>
              ) : (
                "Criar vídeo"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
} 