export interface VideoFormValues {
  titulo: string;
  descricao: string;
  categoria_id: string;
  autor_id: string;
  video_id?: string;
  thumbnail_url?: string;
  duracao?: number;
  visibilidade: "PUBLICO" | "PRIVADO" | "ASSINANTES";
}

export interface Categoria {
  id: string;
  nome: string;
}

export interface Autor {
  id: string;
  nome: string;
}

export interface VideoFormProps {
  onSubmit: (data: VideoFormValues) => void;
  isLoading?: boolean;
  categorias?: Categoria[];
  autores?: Autor[];
  videoId?: string;
}

export interface VideoType {
  id: string;
  titulo: string;
  descricao?: string;
  categoria_id: string;
  categoria_nome?: string;
  autor_id: string;
  autor_nome?: string;
  visibilidade: "PUBLICO" | "PRIVADO" | "ASSINANTES";
  video_id: string;
  slug: string;
  status: "POSTED" | "NOT_POSTED";
  publicado_em: string;
  atualizado_em: string;
  thumbnail_url?: string;
  duracao?: number;
  visualizacoes?: number;
  curtidas?: number;
  recursos?: string;
  capitulos?: string;
  plataforma: string;
} 