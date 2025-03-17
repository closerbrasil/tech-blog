import { NextResponse } from 'next/server';
import Mux from '@mux/mux-node';
import { sql } from '@vercel/postgres';

const muxClient = new Mux({
  tokenId: process.env.MUX_TOKEN_ID!,
  tokenSecret: process.env.MUX_TOKEN_SECRET!,
});

interface VideoRow {
  id: string;
  title: string;
  asset_id: string;
  playback_id: string;
  status: string;
  duration: number;
  created_at: string;
  thumbnail_url?: string;
}

export async function GET() {
  try {
    // Buscar vídeos do banco de dados
    const result = await sql<VideoRow>`
      SELECT 
        v.id,
        v.titulo as title,
        v.asset_id,
        v.playback_id,
        v.status,
        v.duracao as duration,
        v.criado_em as created_at,
        v.thumbnail_url
      FROM videos v
      ORDER BY v.criado_em DESC
    `;

    // Para cada vídeo no banco, verificar o status atual no Mux
    const videosWithStatus = await Promise.all(
      result.rows.map(async (video: VideoRow) => {
        try {
          const asset = await muxClient.video.assets.retrieve(video.asset_id);
          return {
            ...video,
            status: asset.status,
            duration: asset.duration || video.duration,
          };
        } catch (error) {
          console.error(`Erro ao buscar status do vídeo ${video.asset_id}:`, error);
          return video;
        }
      })
    );

    return NextResponse.json(videosWithStatus);
  } catch (error) {
    console.error('Erro ao buscar vídeos:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar vídeos' },
      { status: 500 }
    );
  }
} 