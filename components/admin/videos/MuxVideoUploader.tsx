'use client';

import { useState, useEffect } from 'react';
import MuxUploader from '@mux/mux-uploader-react';
import { Upload, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface VideoUploaderProps {
  onUploadComplete: (videoId: string, assetId: string) => void;
}

interface MuxUploadResponse {
  id: string;
  url: string;
  status: string;
  new_asset_settings: {
    playback_policy: string[];
  };
  asset_id?: string;
  playback_id?: string;
}

interface ProgressDetail {
  progress: number;
}

type MuxProgressEvent = CustomEvent<number> | React.SyntheticEvent<HTMLElement>;

interface UploadError {
  message?: string;
}

export function MuxVideoUploader({ onUploadComplete }: VideoUploaderProps) {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadEndpoint, setUploadEndpoint] = useState<string | null>(null);
  const [uploadId, setUploadId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchUploadEndpoint = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await fetch("/api/videos/upload-token");
        if (!response.ok) {
          throw new Error(await response.text());
        }
        const data: MuxUploadResponse = await response.json();
        setUploadEndpoint(data.url);
        setUploadId(data.id);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Erro ao obter endpoint de upload";
        setError(errorMessage);
        toast({
          title: "Erro no upload",
          description: errorMessage,
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchUploadEndpoint();
  }, [toast]);

  const handleUploadStart = () => {
    setIsUploading(true);
    setUploadProgress(0);
    setError(null);
    toast({
      title: "Upload iniciado",
      description: "O upload do vídeo foi iniciado.",
      variant: "default",
    });
  };

  const handleUploadProgress = (progress: number) => {
    setUploadProgress(progress);
  };

  const handleUploadSuccess = async () => {
    try {
      let attempts = 0;
      const maxAttempts = 10;
      const initialDelay = 1000;
      const maxDelay = 5000;

      const checkUploadStatus = async () => {
        const response = await fetch(`/api/videos/check-upload/${uploadId}`);
        if (!response.ok) {
          throw new Error('Erro ao verificar status do upload');
        }
        return await response.json();
      };

      while (attempts < maxAttempts) {
        const data = await checkUploadStatus();
        
        if (data.asset_id && data.playback_id) {
          setIsUploading(false);
          setUploadProgress(100);
          onUploadComplete(data.playback_id, data.asset_id);
          
          toast({
            title: "Upload concluído",
            description: "O vídeo foi enviado com sucesso!",
            variant: "default",
          });
          return;
        }

        attempts++;
        // Exponential backoff com limite máximo
        const delay = Math.min(initialDelay * Math.pow(1.5, attempts), maxDelay);
        await new Promise(resolve => setTimeout(resolve, delay));
      }

      throw new Error('Tempo limite excedido ao processar o vídeo');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro ao processar o vídeo";
      setError(errorMessage);
      toast({
        title: "Erro no upload",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleUploadError = (event: React.SyntheticEvent<HTMLElement>) => {
    setIsUploading(false);
    setUploadProgress(0);
    const error = event as unknown as UploadError;
    const errorMessage = error?.message || "Ocorreu um erro ao fazer upload do vídeo";
    setError(errorMessage);
    toast({
      title: "Erro no upload",
      description: errorMessage,
      variant: "destructive",
    });
  };

  const containerClasses = cn(
    "relative flex items-center justify-center w-full",
    "min-h-[200px] px-4 py-6 transition",
    "bg-muted border-2 border-dashed rounded-lg",
    {
      "hover:border-primary cursor-pointer": !isLoading && !error && !isUploading,
      "border-destructive": error,
      "border-primary": isUploading,
      "opacity-50 cursor-not-allowed": isLoading,
    }
  );

  if (isLoading) {
    return (
      <div className={containerClasses}>
        <div className="flex flex-col items-center space-y-3">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground">
            Preparando área de upload...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={containerClasses}>
        <div className="flex flex-col items-center space-y-3">
          <AlertCircle className="w-8 h-8 text-destructive" />
          <div className="text-center">
            <p className="text-sm font-medium text-destructive">Erro no upload</p>
            <p className="text-xs text-muted-foreground mt-1">{error}</p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="text-xs text-primary hover:underline"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={containerClasses}>
      <MuxUploader
        endpoint={uploadEndpoint!}
        onUploadStart={handleUploadStart}
        onSuccess={handleUploadSuccess}
        onError={handleUploadError}
        onProgress={(event: MuxProgressEvent) => {
          if (event instanceof CustomEvent) {
            handleUploadProgress(event.detail);
          }
        }}
        maxFileSize={2147483648} // 2GB em bytes
        chunkSize={20971520} // 20MB chunks para melhor performance
      >
        {isUploading ? (
          <div className="w-full max-w-md space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Upload em progresso</span>
              <span className="font-medium">{Math.round(uploadProgress)}%</span>
            </div>
            <Progress value={uploadProgress} className="h-2" />
            {uploadProgress === 100 && (
              <div className="flex items-center justify-center space-x-2 text-primary">
                <CheckCircle2 className="w-4 h-4" />
                <span className="text-sm">Processando vídeo...</span>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-4">
            <div className="p-4 rounded-full bg-primary/10">
              <Upload className="w-8 h-8 text-primary" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium">
                Clique ou arraste o vídeo aqui
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Máximo: 2GB. Formatos: MP4, MOV, WebM, WMV, AVI, 3GP
              </p>
            </div>
          </div>
        )}
      </MuxUploader>
    </div>
  );
} 