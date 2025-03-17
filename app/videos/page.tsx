import { Metadata } from 'next'
import { mcp_neon_run_sql } from '@/lib/db'
import { VideoCard } from '@/components/videos/video-card'

export const metadata: Metadata = {
  title: 'Vídeos | Tech Blog',
  description: 'Confira nossos vídeos sobre tecnologia, programação e inovação',
}

// Configuração de cache para melhorar o desempenho
export const revalidate = 3600; // Revalidar a cada 1 hora

interface DatabaseVideo {
  id: string
  titulo: string
  slug: string
  thumbnail_url: string | null
  meta_descricao: string | null
  duracao: number | null
  visualizacoes: number | null
  publicado_em: Date
  status: string
  visibilidade: string
  autores: {
    nome: string
    avatar_url: string
  } | null
  categorias: {
    nome: string
    cor: string
  } | null
}

async function getVideos() {
  try {
    const result = await mcp_neon_run_sql({
      params: {
        projectId: process.env.NEON_PROJECT_ID!,
        databaseName: process.env.NEON_DATABASE_NAME || 'neondb',
        sql: `
          SELECT 
            v.*,
            a.nome as autor_nome,
            a.avatar_url as autor_avatar_url,
            c.nome as categoria_nome,
            c.cor as categoria_cor
          FROM videos v
          LEFT JOIN autores a ON v.autor_id = a.id
          LEFT JOIN categorias c ON v.categoria_id = c.id
          WHERE v.status = 'publicado' 
            AND v.visibilidade = 'PUBLIC'
            AND v.playback_id IS NOT NULL
          ORDER BY v.publicado_em DESC NULLS LAST, v.criado_em DESC
        `,
      }
    });

    return result.rows.map((video: any) => {
      // Gera as URLs do Mux
      const thumbnailUrl = video.playback_id 
        ? `https://image.mux.com/${video.playback_id}/thumbnail.jpg`
        : '/placeholder-video.jpg';

      return {
        id: video.id,
        titulo: video.titulo,
        slug: video.slug,
        thumbnail_url: thumbnailUrl,
        meta_descricao: video.meta_descricao || video.descricao,
        duracao: video.duracao || 0,
        visualizacoes: video.visualizacoes || 0,
        publicado_em: video.publicado_em || video.criado_em,
        autor: video.autor_nome ? {
          nome: video.autor_nome,
          avatar_url: video.autor_avatar_url || '/placeholder-avatar.jpg'
        } : undefined,
        categoria: video.categoria_nome ? {
          nome: video.categoria_nome,
          cor: video.categoria_cor || '#CBD5E1'
        } : undefined
      };
    });
  } catch (error) {
    console.error('Erro ao buscar vídeos:', error);
    return [];
  }
}

export default async function VideosPage() {
  const videos = await getVideos();

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-center text-gray-900 dark:text-white">Vídeos</h1>
          <p className="mt-4 text-center text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Confira nossa coleção de vídeos sobre tecnologia, programação e inovação. 
            Atualizamos regularmente com novo conteúdo.
          </p>
        </div>

        {videos.length === 0 ? (
          <div className="text-center py-12">
            <div className="mb-4">
              <svg 
                className="mx-auto h-12 w-12 text-gray-400" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" 
                />
              </svg>
            </div>
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">Nenhum vídeo encontrado</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Verifique se existem vídeos publicados e públicos no banco de dados.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {videos.map((video) => (
              <VideoCard
                key={video.id}
                titulo={video.titulo}
                slug={video.slug}
                thumbnail_url={video.thumbnail_url}
                meta_descricao={video.meta_descricao}
                autor={video.autor}
                visualizacoes={video.visualizacoes}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
} 