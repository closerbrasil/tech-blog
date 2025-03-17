import { Metadata } from 'next'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import AdBanner from '@/components/ads/ad-banner'
import Newsletter from '@/components/newsletter'
import { RelatedVideos } from '@/components/videos/RelatedVideos'
import VideoPlayer from '@/components/videos/VideoPlayer'
import { mcp_neon_run_sql } from '@/lib/db'
import { Eye, ThumbsUp } from 'lucide-react'

interface VideoPageProps {
  params: Promise<{
    slug: string
  }>
}

interface VideoData {
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
  status: 'PUBLIC' | 'PRIVATE';
  slug: string;
  thumbnail_url: string;
  criado_em: string;
  atualizado_em: string;
  visualizacoes: number;
  curtidas: number;
  recursos: string;
  conteudo: string;
  publicado_em: string;
  autores?: {
    id: string;
    nome: string;
    avatar_url: string;
  };
  categorias?: {
    id: string;
    nome: string;
    cor: string;
  };
}

interface RelatedVideo {
  id: string;
  slug: string;
  title: string;
  description: string;
  views: number;
  thumbnail: string;
}

export async function generateStaticParams() {
  const result = await mcp_neon_run_sql({
    params: {
      sql: `
        SELECT slug 
        FROM videos 
        WHERE status = 'PUBLIC'
      `
    }
  });

  return result.rows.map((video) => ({
    slug: video.slug
  }));
}

export async function generateMetadata({ params }: VideoPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  
  const result = await mcp_neon_run_sql({
    params: {
      sql: `
        SELECT v.*, a.nome as autor_nome
        FROM videos v
        LEFT JOIN autores a ON v.autor_id = a.id
        WHERE v.slug = $1
      `,
      values: [resolvedParams.slug]
    }
  });

  const video = result.rows[0];

  if (!video) {
    return {
      title: 'Vídeo não encontrado',
    }
  }

  const metadata: Metadata = {
    title: video.titulo,
    description: video.descricao,
    openGraph: {
      title: video.titulo,
      description: video.descricao,
      images: [video.thumbnail_url],
      type: 'video.other',
      videos: [video.url_video]
    }
  };

  return metadata;
}

export default async function VideoPage({ params }: VideoPageProps) {
  const resolvedParams = await params;

  // Buscar vídeo pelo slug
  const result = await mcp_neon_run_sql({
    params: {
      sql: `
        SELECT *
        FROM videos v
        WHERE status = 'PUBLIC'
        AND slug = $1
      `,
      values: [resolvedParams.slug]
    }
  });

  const videoRow = result.rows[0];

  if (!videoRow) {
    notFound()
  }

  // Transformar o resultado em VideoData
  const video: VideoData = {
    id: videoRow.id,
    titulo: videoRow.titulo,
    descricao: videoRow.descricao,
    transcricao: videoRow.transcricao,
    youtube_url: videoRow.youtube_url,
    url_video: videoRow.url_video,
    asset_id: videoRow.asset_id,
    playback_id: videoRow.playback_id,
    track_id: videoRow.track_id,
    origem: videoRow.origem,
    status: videoRow.status,
    slug: videoRow.slug,
    thumbnail_url: videoRow.thumbnail_url || '',
    criado_em: videoRow.criado_em,
    atualizado_em: videoRow.atualizado_em,
    visualizacoes: videoRow.visualizacoes || 0,
    curtidas: videoRow.curtidas || 0,
    recursos: videoRow.recursos || '[]',
    conteudo: videoRow.conteudo || '',
    publicado_em: videoRow.publicado_em,
    autores: videoRow.autor_id ? {
      id: videoRow.autor_id,
      nome: videoRow.autor_nome,
      avatar_url: videoRow.autor_avatar_url
    } : undefined,
    categorias: videoRow.categoria_id ? {
      id: videoRow.categoria_id,
      nome: videoRow.categoria_nome,
      cor: videoRow.categoria_cor
    } : undefined
  };

  // Buscar vídeos relacionados
  const relatedVideos = await mcp_neon_run_sql({
    params: {
      sql: `
        SELECT v.*
        FROM videos v
        WHERE v.status = 'PUBLIC'
        AND v.id != $1
        LIMIT 3
      `,
      values: [video.id]
    }
  });

  const videosRelacionados = relatedVideos.rows;

  // Se não encontrar vídeos da mesma categoria, busca os mais recentes
  const fallbackResult = videosRelacionados.length === 0 ? await mcp_neon_run_sql({
    params: {
      sql: `
        SELECT *
        FROM videos
        WHERE id > $1
        AND status = 'PUBLIC'
        ORDER BY id ASC
        LIMIT 1
      `,
      values: [video.id]
    }
  }) : { rows: [] };

  const videosToShow = videosRelacionados.length > 0 ? videosRelacionados : fallbackResult.rows;

  let recursos: any[] = []
  try {
    if (typeof video.recursos === 'string') {
      recursos = JSON.parse(video.recursos);
    }
  } catch (error) {
    // Silenciosamente ignora erros de parse
  }

  // Link para debug da API
  const debugApiUrl = `/api/debug/video?slug=${video.slug}`;

  // Formatar vídeos relacionados
  const relatedVideosFormatted: RelatedVideo[] = videosToShow
    .filter((video: any) => video.thumbnail_url !== null)
    .map((video: any) => ({
      id: video.id,
      slug: video.slug,
      title: video.titulo,
      description: video.meta_descricao,
      views: video.visualizacoes,
      thumbnail: video.thumbnail_url
    }));

  const nextVideo = await mcp_neon_run_sql({
    params: {
      sql: `
        SELECT *
        FROM videos
        WHERE id > $1
        AND status = 'PUBLIC'
        ORDER BY id ASC
        LIMIT 1
      `,
      values: [video.id]
    }
  });

  const previousVideo = await mcp_neon_run_sql({
    params: {
      sql: `
        SELECT *
        FROM videos
        WHERE id < $1
        AND status = 'PUBLIC'
        ORDER BY id DESC
        LIMIT 1
      `,
      values: [video.id]
    }
  });

  return (
    <div className="max-w-[1100px] mx-auto px-4 py-8">
      {/* Banner do MongoDB */}
      <div className="mb-8">
        <AdBanner position="top" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8">
          <article>
            <h1 className="text-xl md:text-2xl font-bold mb-4">{video.titulo}</h1>

            {video.playback_id ? (
              <div className="mb-6">
                <VideoPlayer 
                  videoId={video.playback_id} 
                  title={video.titulo}
                  poster={`https://image.mux.com/${video.playback_id}/thumbnail.jpg`}
                />
                <div className="mt-2 text-xs text-gray-500">
                  Player ID: {video.playback_id}
                </div>
              </div>
            ) : (
              <div className="aspect-video w-full mb-6 bg-gray-900 rounded-xl flex items-center justify-center">
                <p className="text-white text-center p-4">Vídeo não disponível (ID não encontrado)</p>
              </div>
            )}

            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                {video.autores && (
                  <>
                    <Image
                      src={video.autores.avatar_url}
                      alt={video.autores.nome}
                      width={40}
                      height={40}
                      className="rounded-full mr-3"
                    />
                    <div>
                      <p className="font-medium">{video.autores.nome}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {video.publicado_em ? new Date(video.publicado_em).toLocaleDateString('pt-BR') : ''}
                      </p>
                    </div>
                  </>
                )}
              </div>

              <div className="flex items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  <span>{video.visualizacoes} visualizações</span>
                </div>
                <div className="flex items-center gap-1">
                  <ThumbsUp className="h-4 w-4" />
                  <span>{video.curtidas} curtidas</span>
                </div>
              </div>
            </div>

            {video.categorias && (
              <div className="mb-6">
                <span
                  className="inline-block px-3 py-1 rounded-full text-sm text-white"
                  style={{ backgroundColor: video.categorias.cor }}
                >
                  {video.categorias.nome}
                </span>
              </div>
            )}

            {video.conteudo && (
              <div className="prose dark:prose-invert max-w-none mb-8" dangerouslySetInnerHTML={{ __html: video.conteudo }} />
            )}

            {recursos.length > 0 && (
              <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-6 mb-8">
                <h2 className="text-lg font-semibold mb-4">Recursos do Vídeo</h2>
                <ul className="space-y-2">
                  {recursos.map((recurso, index) => (
                    <li key={index}>
                      <a
                        href={recurso.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        {recurso.titulo || 'Recurso ' + (index + 1)}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </article>
        </div>

        <div className="lg:col-span-4">
          <RelatedVideos videos={relatedVideosFormatted} />
          <Newsletter />
          <AdBanner position="sidebar" />
        </div>
      </div>
    </div>
  );
} 