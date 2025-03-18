import { NextResponse } from 'next/server';
import Mux from '@mux/mux-node';

const muxClient = new Mux({
  tokenId: process.env.MUX_TOKEN_ID || '',
  tokenSecret: process.env.MUX_TOKEN_SECRET || '',
});

export async function GET() {
  try {
    // Buscar todos os assets do Mux
    const { data: assets } = await muxClient.video.assets.list({
      limit: 100
    });

    // Formatar os dados para o frontend
    const videos = assets.map(asset => ({
      id: asset.id,
      title: asset.meta?.title || `Vídeo ${asset.id.slice(-6)}`, // Título padrão se não houver
      asset_id: asset.id,
      playback_id: asset.playback_ids?.[0]?.id,
      status: asset.status,
      duration: asset.duration || 0,
      created_at: asset.created_at,
      thumbnail_url: asset.playback_ids?.[0]?.id 
        ? `https://image.mux.com/${asset.playback_ids[0].id}/thumbnail.jpg?time=0`
        : undefined,
      views: asset.tracks?.length || 0, // Número de faixas como proxy para visualizações
      meta: asset.meta || {} // Preservar metadados adicionais
    }));

    // Ordenar por data de criação (mais recentes primeiro)
    videos.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return NextResponse.json(videos);
  } catch (error) {
    console.error('Erro ao buscar vídeos:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar vídeos do Mux' },
      { status: 500 }
    );
  }
} 