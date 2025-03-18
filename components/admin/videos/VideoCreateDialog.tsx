'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Loader2, AlertCircle, Link as LinkIcon } from 'lucide-react';

const formSchema = z.object({
  url: z.string().url('URL inválida').min(1, 'URL é obrigatória'),
  category_id: z.string().min(1, 'Categoria é obrigatória'),
});

interface VideoCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  categories: { id: string; name: string }[];
}

type FormValues = z.infer<typeof formSchema>;

export function VideoCreateDialog({
  open,
  onOpenChange,
  onSuccess,
  categories,
}: VideoCreateDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [existingVideo, setExistingVideo] = useState<{ url: string; title: string } | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      url: '',
      category_id: '',
    },
  });

  const onSubmit = async (data: FormValues) => {
    try {
      setIsSubmitting(true);
      setError(null);
      setProgress(10);
      setExistingVideo(null);

      const response = await fetch('/api/admin/youtube-downloader', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        if (response.status === 409) {
          const errorData = await response.json();
          setExistingVideo({
            url: errorData.existingUrl,
            title: errorData.title || 'Vídeo existente'
          });
          setError('Este vídeo já foi baixado anteriormente.');
          return;
        }
        throw new Error('Erro ao baixar o vídeo');
      }

      setProgress(100);
      toast({
        title: 'Sucesso!',
        description: 'Vídeo baixado com sucesso.',
      });

      form.reset();
      onSuccess?.();
      onOpenChange(false);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Erro ao baixar o vídeo');
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível baixar o vídeo. Tente novamente.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      form.reset();
      setError(null);
      setProgress(0);
      setExistingVideo(null);
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Baixar vídeo do YouTube</DialogTitle>
          <DialogDescription>
            Cole a URL do vídeo do YouTube que você deseja baixar.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL do vídeo</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <LinkIcon className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="https://youtube.com/..." className="pl-8" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoria principal</FormLabel>
                  <FormControl>
                    <select
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                      {...field}
                    >
                      <option value="">Selecione uma categoria</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Erro</AlertTitle>
                <AlertDescription className="mt-2">
                  {error}
                  {existingVideo && (
                    <div className="mt-2">
                      <a
                        href={existingVideo.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline flex items-center gap-1"
                      >
                        <LinkIcon className="h-4 w-4" />
                        Ver vídeo existente
                      </a>
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}

            {isSubmitting && (
              <div className="space-y-2">
                <Progress value={progress} />
                <p className="text-sm text-muted-foreground">
                  {progress < 100 ? 'Baixando vídeo...' : 'Concluído!'}
                </p>
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Baixando...
                  </>
                ) : (
                  'Baixar vídeo'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 