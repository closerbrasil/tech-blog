import { z } from 'zod';

// Schemas Zod para validação
export const noticiaSchema = z.object({
  titulo: z.string().min(3, "O título precisa ter pelo menos 3 caracteres"),
  slug: z.string(),
  conteudo: z.string().min(10, "O conteúdo precisa ter pelo menos 10 caracteres"),
  image_url: z.string().url("URL da imagem inválida"),
  imagem_credito: z.string().optional(),
  autor_id: z.string().uuid("ID do autor inválido"),
  categoria_id: z.string().uuid("ID da categoria inválido"),
  meta_descricao: z.string().optional(),
  palavra_chave: z.string().optional(),
  tempo_leitura: z.string().optional(),
  status: z.enum(["PUBLIC", "PRIVATE"]),
  imagem_alt: z.string().optional(),
  schema_type: z.enum(["Article", "NewsArticle", "BlogPosting"])
});

export const autorSchema = z.object({
  nome: z.string().min(3, "O nome precisa ter pelo menos 3 caracteres"),
  slug: z.string(),
  bio: z.string().min(10, "A biografia precisa ter pelo menos 10 caracteres"),
  avatar_url: z.string().url("URL do avatar inválida"),
  cargo: z.string(),
  email: z.string().email("Email inválido"),
  twitter_url: z.string().url("URL do Twitter inválida").optional(),
  linkedin_url: z.string().url("URL do LinkedIn inválida").optional(),
  github_url: z.string().url("URL do GitHub inválida").optional(),
  website_url: z.string().url("URL do website inválida").optional()
});

export const categoriaSchema = z.object({
  nome: z.string().min(3, "O nome precisa ter pelo menos 3 caracteres"),
  slug: z.string(),
  descricao: z.string().min(10, "A descrição precisa ter pelo menos 10 caracteres").optional(),
  image_url: z.string().url("URL da imagem inválida").optional(),
  cor: z.string().regex(/^#([A-Fa-f0-9]{6})$/, "Cor hexadecimal inválida"),
  parent_id: z.string().uuid("ID da categoria pai inválido").optional()
});

export const videoSchema = z.object({
  id: z.string().uuid().optional(),
  titulo: z.string().min(1, "O título é obrigatório"),
  slug: z.string().min(1, "O slug é obrigatório"),
  descricao: z.string().optional(),
  thumbnail_url: z.string().url("URL inválida").optional(),
  url_video: z.string().url("URL inválida").optional(),
  duracao: z.number().int().optional(),
  visualizacoes: z.number().int().default(0),
  curtidas: z.number().int().default(0),
  categoria_id: z.string().uuid("ID da categoria inválido").optional(),
  origem: z.string().default("youtube"),
  status: z.enum(["PUBLIC", "PRIVATE"]).default("PRIVATE"),
  meta_descricao: z.string().optional(),
  keywords: z.array(z.string()).optional(),
  transcricao: z.string().optional(),
  asset_id: z.string().optional(),
  playback_id: z.string().optional(),
  youtube_url: z.string().url("URL inválida").optional(),
  conteudo: z.string().optional(),
  publicado_em: z.string().optional(),
  autor_id: z.string().uuid("ID do autor inválido").optional(),
  capitulos: z.string().optional(),
  track_id: z.string().optional(),
  criado_em: z.string().optional(),
  atualizado_em: z.string().optional()
});

export const videoInputSchema = z.object({
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
});

export const tagSchema = z.object({
  id: z.string().uuid(),
  nome: z.string().min(1, "O nome é obrigatório"),
  slug: z.string().min(1, "O slug é obrigatório"),
  criado_em: z.string(),
  atualizado_em: z.string(),
});

// Tipos inferidos dos schemas
export type Noticia = z.infer<typeof noticiaSchema> & {
  id: string;
  publicado_em: string;
  atualizado_em: string;
};

export type Autor = z.infer<typeof autorSchema> & {
  id: string;
  criado_em: string;
  atualizado_em: string;
};

export type Categoria = z.infer<typeof categoriaSchema> & {
  id: string;
  criado_em: string;
  atualizado_em: string;
  level?: number;
  path?: string[];
};

export type VideoType = z.infer<typeof videoSchema>;

export type Video = VideoType & {
  id: string;
  criado_em: string;
  atualizado_em: string;
  categoria?: {
    id: string;
    nome: string;
    cor: string;
  };
  autor?: {
    id: string;
    nome: string;
    avatar_url: string;
    cargo: string;
  };
};

export type Tag = z.infer<typeof tagSchema> & {
  id: string;
  criado_em: string;
  atualizado_em: string;
};

// Tipos para inserção (sem campos automáticos)
export type InsertNoticia = z.infer<typeof noticiaSchema>;
export type InsertAutor = z.infer<typeof autorSchema>;
export type InsertCategoria = z.infer<typeof categoriaSchema>;
export type InsertVideo = z.infer<typeof videoSchema>;
export type InsertTag = z.infer<typeof tagSchema>;

// Re-exportar os schemas para validação
export const insertNoticiaSchema = noticiaSchema;
export const insertAutorSchema = autorSchema;
export const insertCategoriaSchema = categoriaSchema;
export const insertVideoSchema = videoSchema;
export const insertTagSchema = tagSchema;

export type VideoSchema = z.infer<typeof videoSchema>; 