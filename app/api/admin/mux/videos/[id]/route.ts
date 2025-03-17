import { NextResponse } from 'next/server';
import Mux from '@mux/mux-node';
import { sql } from '@vercel/postgres';

const muxClient = new Mux({
  tokenId: process.env.MUX_TOKEN_ID!,
  tokenSecret: process.env.MUX_TOKEN_SECRET!,
});

interface VideoRow {
  asset_id: string;
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Buscar o vídeo no banco de dados
    const result = await sql<VideoRow>`
      SELECT asset_id
      FROM videos
      WHERE id = ${params.id}
    `;

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Vídeo não encontrado' },
        { status: 404 }
      );
    }

    const { asset_id } = result.rows[0];

    // Excluir o asset do Mux
    try {
      await muxClient.video.assets.delete(asset_id);
    } catch (error) {
      console.error('Erro ao excluir asset do Mux:', error);
      // Continuar mesmo se falhar no Mux, pois o asset pode não existir mais
    }

    // Excluir o vídeo do banco de dados
    await sql`
      DELETE FROM videos
      WHERE id = ${params.id}
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao excluir vídeo:', error);
    return NextResponse.json(
      { error: 'Erro ao excluir vídeo' },
      { status: 500 }
    );
  }
} 