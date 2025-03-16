import axios from 'axios';
import { z } from 'zod';

// Tipos baseados no schema Prisma
export interface Noticia {
  id: string;
  titulo: string;
  slug: string;
  conteudo: string;
  image_url: string;
  imagem_credito?: string;
  autor_id: string;
  categoria_id: string;
  publicado_em: string;
  atualizado_em: string;
  meta_descricao?: string;
  palavra_chave?: string;
  tempo_leitura?: string;
  status: string;
  visibilidade: string;
  imagem_alt?: string;
}

export interface Video {
  id: string;
  video_id: string;
  plataforma: string;
  titulo: string;
  thumbnail_url?: string;
  embed_url?: string;
  duracao?: number;
  visualizacoes?: number;
  curtidas?: number;
  slug: string;
  autor_id?: string;
  categoria_id?: string;
  publicado_em: string;
  atualizado_em: string;
  status: string;
  visibilidade: string;
  conteudo: string;
  meta_descricao: string;
}

export interface Autor {
  id: string;
  nome: string;
  slug: string;
  bio: string;
  avatar_url: string;
  cargo: string;
  email: string;
  twitter_url?: string | null;
  linkedin_url?: string | null;
  github_url?: string | null;
  website_url?: string | null;
  criado_em: string;
  atualizado_em: string;
}

export interface Categoria {
  id: string;
  nome: string;
  slug: string;
  descricao?: string;
  image_url?: string;
  cor: string;
}

export interface Tag {
  id: string;
  nome: string;
  slug: string;
  descricao?: string;
}

export interface NoticiasResponse {
  noticias: Noticia[];
  total: number;
}

export interface VideosResponse {
  videos: Video[];
  total: number;
}

// Schema de validação para criação/atualização de autor
export const insertAutorSchema = z.object({
  nome: z.string().min(3, "O nome precisa ter pelo menos 3 caracteres"),
  slug: z.string(),
  bio: z.string().min(10, "A biografia precisa ter pelo menos 10 caracteres"),
  avatar_url: z.string().url("URL do avatar inválida").nullish(),
  cargo: z.string().min(2, "O cargo precisa ter pelo menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  twitter_url: z.string().url("URL do Twitter inválida").nullish(),
  linkedin_url: z.string().url("URL do LinkedIn inválida").nullish(),
  github_url: z.string().url("URL do GitHub inválida").nullish(),
  website_url: z.string().url("URL do website inválida").nullish(),
});

export type InsertAutor = z.infer<typeof insertAutorSchema>;

// Cliente API
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Rotas da API
export const apiRoutes = {
  noticias: {
    list: async (): Promise<NoticiasResponse> => {
      const response = await api.get('/noticias');
      return response.data;
    },
    create: async (data: Partial<Noticia>) => {
      const response = await api.post('/noticias', data);
      return response.data;
    },
    update: async (id: string, data: Partial<Noticia>) => {
      const response = await api.patch(`/noticias/${id}`, data);
      return response.data;
    },
    delete: async (id: string) => {
      const response = await api.delete(`/noticias/${id}`);
      return response.data;
    },
  },
  videos: {
    list: async (): Promise<VideosResponse> => {
      const response = await api.get('/videos');
      return response.data;
    },
    create: async (data: Partial<Video>) => {
      const response = await api.post('/videos', data);
      return response.data;
    },
    update: async (id: string, data: Partial<Video>) => {
      const response = await api.patch(`/videos/${id}`, data);
      return response.data;
    },
    delete: async (id: string) => {
      const response = await api.delete(`/videos/${id}`);
      return response.data;
    },
  },
  autores: {
    list: async (): Promise<Autor[]> => {
      const response = await api.get('/autores');
      return response.data;
    },
    create: async (data: Partial<Autor>) => {
      const response = await api.post('/autores', data);
      return response.data;
    },
    update: async (id: string, data: Partial<Autor>) => {
      const response = await api.patch(`/autores/${id}`, data);
      return response.data;
    },
    delete: async (id: string) => {
      const response = await api.delete(`/autores/${id}`);
      return response.data;
    },
  },
  categorias: {
    list: async (): Promise<Categoria[]> => {
      const response = await api.get('/categorias');
      return response.data;
    },
    create: async (data: Partial<Categoria>) => {
      const response = await api.post('/categorias', data);
      return response.data;
    },
    update: async (id: string, data: Partial<Categoria>) => {
      const response = await api.patch(`/categorias/${id}`, data);
      return response.data;
    },
    delete: async (id: string) => {
      const response = await api.delete(`/categorias/${id}`);
      return response.data;
    },
  },
  tags: {
    list: async (): Promise<Tag[]> => {
      const response = await api.get('/tags');
      return response.data;
    },
    create: async (data: Partial<Tag>) => {
      const response = await api.post('/tags', data);
      return response.data;
    },
    update: async (id: string, data: Partial<Tag>) => {
      const response = await api.patch(`/tags/${id}`, data);
      return response.data;
    },
    delete: async (id: string) => {
      const response = await api.delete(`/tags/${id}`);
      return response.data;
    },
  },
};

export default api; 