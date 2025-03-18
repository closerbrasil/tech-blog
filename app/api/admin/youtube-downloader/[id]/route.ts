import { NextRequest, NextResponse } from 'next/server';
import { mcp_neon_run_sql } from '@/lib/mcp';

export async function DELETE(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;

    // Verifica se o vídeo existe e pode ser removido
    const checkResult = await mcp_neon_run_sql({
      params: {
        projectId: process.env.NEON_PROJECT_ID!,
        databaseName: process.env.NEON_DATABASE_NAME || 'neondb',
        sql: `
          SELECT processing_status
          FROM videos 
          WHERE id = $1
        `,
        values: [id]
      }
    });

    if (!checkResult?.rows?.length) {
      return NextResponse.json(
        { error: 'Vídeo não encontrado' },
        { status: 404 }
      );
    }

    const status = checkResult.rows[0].processing_status;
    if (status === 'processing') {
      return NextResponse.json(
        { error: 'Não é possível remover um vídeo em processamento' },
        { status: 400 }
      );
    }

    // Remove o vídeo e suas relações
    await mcp_neon_run_sql({
      params: {
        projectId: process.env.NEON_PROJECT_ID!,
        databaseName: process.env.NEON_DATABASE_NAME || 'neondb',
        sql: `
          BEGIN;
          
          -- Remove as relações com categorias
          DELETE FROM videos_categorias 
          WHERE video_id = $1;
          
          -- Remove o vídeo
          DELETE FROM videos 
          WHERE id = $1;
          
          COMMIT;
        `,
        values: [id]
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao remover vídeo:', error);
    return NextResponse.json(
      { error: 'Erro ao remover vídeo' },
      { status: 500 }
    );
  }
} 