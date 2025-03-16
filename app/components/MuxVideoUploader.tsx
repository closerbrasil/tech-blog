import MuxUploader from "@mux/mux-uploader-react";
import { useCallback, useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface VideoUploaderProps {
  onUploadComplete: (videoId: string, assetId: string) => void;
}

interface MuxUploadResponse {
  asset_id?: string;
  playback_id?: string;
}

export function MuxVideoUploader({ onUploadComplete }: VideoUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const handleUploadStart = useCallback(() => {
    setIsUploading(true);
    toast({
      title: "Upload iniciado",
      description: "O upload do vídeo foi iniciado.",
    });
  }, [toast]);

  const handleUploadSuccess = useCallback(async () => {
    try {
      // Aguarda um momento para garantir que o upload foi processado
      await new Promise(resolve => setTimeout(resolve, 2000));

      const response = await fetch('/api/videos/check-upload/latest');
      const data: MuxUploadResponse = await response.json();

      if (data.playback_id && data.asset_id) {
        setIsUploading(false);
        onUploadComplete(data.playback_id, data.asset_id);
        toast({
          title: "Upload concluído",
          description: "O vídeo foi enviado com sucesso!",
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erro ao processar o vídeo";
      toast({
        title: "Erro no upload",
        description: errorMessage,
        variant: "destructive",
      });
    }
  }, [onUploadComplete, toast]);

  const handleUploadError = useCallback(() => {
    setIsUploading(false);
    toast({
      title: "Erro no upload",
      description: "Ocorreu um erro ao fazer upload do vídeo",
      variant: "destructive",
    });
  }, [toast]);

  return (
    <div className="relative w-full min-h-[120px] border-2 border-dashed border-gray-300 rounded-lg p-4">
      <MuxUploader
        endpoint="/api/videos/upload"
        onUploadStart={handleUploadStart}
        onSuccess={handleUploadSuccess}
        onError={handleUploadError}
      >
        <div className="text-center">
          <p className="text-sm font-medium">
            {isUploading ? "Enviando vídeo..." : "Clique ou arraste o vídeo aqui"}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Formatos suportados: MP4, MOV, WebM, AVI
          </p>
        </div>
      </MuxUploader>
    </div>
  );
}