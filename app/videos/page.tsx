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
          WHERE v.status = 'POSTED' AND v.visibilidade = 'PUBLICO'
          ORDER BY v.publicado_em DESC
        `
      }
    });

    return result.rows.map((video: any) => ({
      id: video.id,
      titulo: video.titulo,
      slug: video.slug,
      thumbnail_url: video.thumbnail_url || '/placeholder-video.jpg',
      meta_descricao: video.meta_descricao,
      duracao: video.duracao || 0,
      visualizacoes: video.visualizacoes || 0,
      publicado_em: video.publicado_em,
      autor: video.autor_nome ? {
        nome: video.autor_nome,
        avatar_url: video.autor_avatar_url
      } : undefined,
      categoria: video.categoria_nome ? {
        nome: video.categoria_nome,
        cor: video.categoria_cor
      } : undefined
    }));
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
        <h1 className="text-4xl font-bold mb-8 text-center">Vídeos</h1>
        {videos.length === 0 ? (
          <div className="text-center text-gray-600 dark:text-gray-400">
            <p>Nenhum vídeo encontrado</p>
            <p className="mt-2">Verifique se existem vídeos publicados e públicos no banco de dados.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {videos.map((video: {
              id: string
              titulo: string
              slug: string
              thumbnail_url: string
              meta_descricao?: string
              autor?: {
                nome: string
                avatar_url: string
              }
              visualizacoes: number
            }) => (
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