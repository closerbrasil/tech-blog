'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

interface Category {
  id: string;
  name: string;
}

export default function YouTubeDownloader() {
  const [url, setUrl] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchCategories() {
      try {
        const response = await fetch('/api/admin/categories');
        if (!response.ok) {
          throw new Error('Erro ao carregar categorias');
        }
        const data = await response.json();
        setCategories(data);
      } catch (error) {
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar as categorias',
          variant: 'destructive',
        });
      }
    }

    fetchCategories();
  }, [toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!url || !categoryId) {
      toast({
        title: 'Erro',
        description: 'Por favor, preencha todos os campos.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/admin/youtube-downloader', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url,
          categoryId,
        }),
      });

      if (!response.ok) {
        throw new Error('Erro ao processar o vídeo');
      }

      const data = await response.json();

      toast({
        title: 'Sucesso!',
        description: 'Vídeo processado com sucesso.',
      });

      // Limpa o formulário
      setUrl('');
      setCategoryId('');
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao processar o vídeo',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Download de Vídeos do YouTube</CardTitle>
          <CardDescription>
            Faça o download de vídeos do YouTube com áudio em português
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="url">URL do Vídeo</Label>
              <Input
                id="url"
                type="url"
                placeholder="https://www.youtube.com/watch?v=..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Categoria</Label>
              <Select
                value={categoryId}
                onValueChange={setCategoryId}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Processando...' : 'Baixar Vídeo'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 