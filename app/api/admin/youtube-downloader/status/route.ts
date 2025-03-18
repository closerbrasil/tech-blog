import { NextRequest, NextResponse } from 'next/server';
import { mcp_neon_run_sql } from '@/lib/mcp';

export async function GET() {
  try {
    const result = await mcp_neon_run_sql({
      params: {
        projectId: 'green-frost-95083568',
        databaseName: 'neondb',
        sql: `
          SELECT 
            id, 
            youtube_url, 
            processing_status, 
            error, 
            created_at,
            titulo,
            url_video,
            thumbnail_url,
            EXTRACT(EPOCH FROM (NOW() - created_at)) as elapsed_seconds
          FROM videos 
          WHERE processing_status IN ('waiting', 'downloading', 'uploading')
          OR processing_status = 'error'
          OR created_at >= NOW() - INTERVAL '24 hours'
          ORDER BY 
            CASE 
              WHEN processing_status = 'waiting' THEN 1
              WHEN processing_status = 'downloading' THEN 2
              WHEN processing_status = 'uploading' THEN 3
              WHEN processing_status = 'error' THEN 4
              ELSE 5
            END,
            created_at DESC
        `
      }
    });

    // Processa os resultados para adicionar informações úteis à UI
    const videos = result.rows.map(video => {
      // Calcula tempo desde criação em formato legível
      const elapsedSeconds = parseInt(video.elapsed_seconds || '0');
      let timeAgo = '';
      
      if (elapsedSeconds < 60) {
        timeAgo = `${elapsedSeconds} segundos`;
      } else if (elapsedSeconds < 3600) {
        timeAgo = `${Math.floor(elapsedSeconds / 60)} minutos`;
      } else if (elapsedSeconds < 86400) {
        timeAgo = `${Math.floor(elapsedSeconds / 3600)} horas`;
      } else {
        timeAgo = `${Math.floor(elapsedSeconds / 86400)} dias`;
      }

      return {
        ...video,
        time_ago: timeAgo,
        // Status com descrições mais amigáveis
        status_description: getStatusDescription(video.processing_status),
        // Flag para UI saber se deve animar o status
        is_processing: ['waiting', 'downloading', 'uploading'].includes(video.processing_status)
      };
    });

    return NextResponse.json({
      videos,
      count: {
        total: videos.length,
        waiting: videos.filter(v => v.processing_status === 'waiting').length,
        processing: videos.filter(v => ['downloading', 'uploading'].includes(v.processing_status)).length,
        error: videos.filter(v => v.processing_status === 'error').length,
        completed: videos.filter(v => v.processing_status === 'completed').length
      }
    });
  } catch (error) {
    console.error('Erro ao buscar status dos vídeos:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar status dos vídeos' },
      { status: 500 }
    );
  }
}

// Função auxiliar para obter descrição amigável dos status
function getStatusDescription(status: string): string {
  switch (status) {
    case 'waiting':
      return 'Aguardando processamento';
    case 'downloading':
      return 'Baixando vídeo do YouTube';
    case 'uploading':
      return 'Enviando para serviço de streaming';
    case 'completed':
      return 'Processamento concluído';
    case 'error':
      return 'Erro no processamento';
    default:
      return 'Status desconhecido';
  }
}

export async function POST(request: NextRequest) {
  try {
    const { videoIds } = await request.json();

    if (!videoIds?.length) {
      return NextResponse.json(
        { error: 'IDs dos vídeos são obrigatórios' },
        { status: 400 }
      );
    }

    const placeholders = videoIds.map((_: unknown, i: number) => `$${i + 1}`).join(',');
    
    const result = await mcp_neon_run_sql({
      params: {
        projectId: 'green-frost-95083568',
        databaseName: 'neondb',
        sql: `
          SELECT 
            id,
            youtube_url,
            processing_status,
            url_video,
            error,
            titulo,
            thumbnail_url,
            created_at,
            EXTRACT(EPOCH FROM (NOW() - created_at)) as elapsed_seconds
          FROM videos 
          WHERE id IN (${placeholders})
        `,
        values: videoIds
      }
    });

    // Processa os resultados para adicionar informações úteis à UI
    const videos = result.rows.map(video => {
      // Calcula tempo desde criação em formato legível
      const elapsedSeconds = parseInt(video.elapsed_seconds || '0');
      let timeAgo = '';
      
      if (elapsedSeconds < 60) {
        timeAgo = `${elapsedSeconds} segundos`;
      } else if (elapsedSeconds < 3600) {
        timeAgo = `${Math.floor(elapsedSeconds / 60)} minutos`;
      } else if (elapsedSeconds < 86400) {
        timeAgo = `${Math.floor(elapsedSeconds / 3600)} horas`;
      } else {
        timeAgo = `${Math.floor(elapsedSeconds / 86400)} dias`;
      }

      return {
        ...video,
        time_ago: timeAgo,
        status_description: getStatusDescription(video.processing_status),
        is_processing: ['waiting', 'downloading', 'uploading'].includes(video.processing_status)
      };
    });

    return NextResponse.json({
      videos
    });
  } catch (error) {
    console.error('Erro ao buscar status dos vídeos:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar status dos vídeos' },
      { status: 500 }
    );
  }
} 