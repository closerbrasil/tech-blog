export interface VideoFormValues {
  titulo: string;
  descricao: string;
  categoria_id: string;
  autor_id: string;
  video_id?: string;
  thumbnail_url?: string;
  duracao?: number;
  status: "PUBLIC" | "PRIVATE";
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
  id?: string;
  titulo: string;
  descricao: string;
  transcricao?: string;
  youtube_url: string;
  url_video: string;
  asset_id: string;
  playback_id: string;
  track_id: string;
  origem: string;
  status: "PUBLIC" | "PRIVATE";
  slug: string;
  thumbnail_url: string;
  categorias?: {
    id: string;
    nome: string;
    cor?: string;
  };
  autores?: {
    id: string;
    nome: string;
    avatar_url?: string;
    cargo?: string;
  };
}

export interface Video {
  id: string;
  titulo: string;
  descricao: string;
  transcricao: string;
  youtube_url: string;
  url_video: string;
  asset_id: string;
  playback_id: string;
  track_id: string;
  origem: string;
  status: "PUBLIC" | "PRIVATE";
  slug: string;
  thumbnail_url: string;
  criado_em: string;
  atualizado_em: string;
}

export interface VideoInput {
  id?: string;
  titulo: string;
  descricao: string;
  transcricao?: string;
  youtube_url: string;
  url_video: string;
  asset_id: string;
  playback_id: string;
  track_id: string;
  origem: string;
  status: "PUBLIC" | "PRIVATE";
  slug: string;
  thumbnail_url: string;
} 