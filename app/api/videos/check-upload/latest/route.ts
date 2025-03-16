import { NextResponse } from "next/server";
import { headers } from "next/headers";
import Mux from "@mux/mux-node";
import { env } from '@/env.mjs';

// Inicializa o cliente Mux corretamente
const muxClient = new Mux({
  tokenId: env.MUX_TOKEN_ID,
  tokenSecret: env.MUX_TOKEN_SECRET,
});

export async function GET() {
  try {
    // Buscar a lista de uploads mais recentes
    const uploads = await muxClient.video.uploads.list({
      limit: 1,
    });

    if (!uploads || !uploads.data || uploads.data.length === 0) {
      return NextResponse.json(
        { error: 'Nenhum upload encontrado' },
        { status: 404 }
      );
    }

    const latestUpload = uploads.data[0];

    if (!latestUpload.asset_id) {
      return NextResponse.json(
        { error: 'Upload ainda não processado' },
        { status: 404 }
      );
    }

    // Buscar o asset para obter o playback ID
    const asset = await muxClient.video.assets.retrieve(latestUpload.asset_id);

    if (!asset || !asset.playback_ids || asset.playback_ids.length === 0) {
      return NextResponse.json(
        { error: 'Playback ID não disponível' },
        { status: 404 }
      );
    }

    // Retornar tanto o asset ID quanto o playback ID
    return NextResponse.json({
      asset_id: latestUpload.asset_id,
      playback_id: asset.playback_ids[0].id,
      status: asset.status,
    });
  } catch (error) {
    console.error('Erro ao verificar upload:', error);
    return NextResponse.json(
      { error: 'Erro ao verificar status do upload' },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  const headersList = await headers();
  const origin = headersList.get("origin") || "*";

  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400",
    },
  });
} 