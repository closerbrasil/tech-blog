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
  status: z.enum(["DRAFT", "POSTED", "ARCHIVED"]),
  visibilidade: z.enum(["PUBLICO", "PRIVADO"]),
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
  cor: z.string().regex(/^#([A-Fa-f0-9]{6})$/, "Cor hexadecimal inválida")
});

export const videoSchema = z.object({
  video_id: z.string(),
  plataforma: z.string(),
  titulo: z.string().min(3, "O título precisa ter pelo menos 3 caracteres"),
  thumbnail_url: z.string().url("URL da thumbnail inválida").optional(),
  embed_url: z.string().url("URL do embed inválida").optional(),
  duracao: z.number().optional(),
  visualizacoes: z.number().optional(),
  curtidas: z.number().optional(),
  slug: z.string(),
  autor_id: z.string().uuid("ID do autor inválido").optional(),
  categoria_id: z.string().uuid("ID da categoria inválido").optional(),
  status: z.enum(["DRAFT", "POSTED", "ARCHIVED"]),
  visibilidade: z.enum(["PUBLICO", "PRIVADO"]),
  conteudo: z.string(),
  meta_descricao: z.string(),
  transcricao_url: z.string().url("URL da transcrição inválida").optional(),
  transcricao_original_filename: z.string().optional(),
  recursos: z.string(),
  capitulos: z.string()
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
};

export type Video = z.infer<typeof videoSchema> & {
  id: string;
  publicado_em: string;
  atualizado_em: string;
};

// Tipos para inserção (sem campos automáticos)
export type InsertNoticia = z.infer<typeof noticiaSchema>;
export type InsertAutor = z.infer<typeof autorSchema>;
export type InsertCategoria = z.infer<typeof categoriaSchema>;
export type InsertVideo = z.infer<typeof videoSchema>;

// Re-exportar os schemas para validação
export const insertNoticiaSchema = noticiaSchema;
export const insertAutorSchema = autorSchema;
export const insertCategoriaSchema = categoriaSchema;
export const insertVideoSchema = videoSchema; 