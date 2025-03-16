import { NextRequest, NextResponse } from 'next/server';
import { mcp_neon_run_sql } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const slug = url.searchParams.get('slug');
    
    if (!slug) {
      return NextResponse.json({ error: 'Parâmetro slug obrigatório' }, { status: 400 });
    }

    const result = await mcp_neon_run_sql({
      params: {
        projectId: process.env.NEON_PROJECT_ID!,
        databaseName: process.env.NEON_DATABASE_NAME || 'neondb',
        sql: `
          SELECT * FROM videos 
          WHERE slug = '${slug}'
        `
      }
    });

    if (!result.rows[0]) {
      return NextResponse.json({ error: 'Vídeo não encontrado' }, { status: 404 });
    }

    const video = result.rows[0];

    // Gera uma URL para testar diretamente no embed do Mux
    const testUrl = `https://iframe.mediadelivery.net/embed/${video.video_id}`;

    return NextResponse.json({
      video,
      testUrl,
      debug: {
        video_id: {
          value: video.video_id,
          type: typeof video.video_id,
          length: video.video_id?.length,
          isEmpty: !video.video_id
        }
      }
    });

  } catch (error) {
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
} 