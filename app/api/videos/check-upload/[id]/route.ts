import { NextResponse } from "next/server";
import { headers } from "next/headers";
import Mux from "@mux/mux-node";
import { env } from '@/env.mjs';

// Inicializa o cliente Mux corretamente
const muxClient = new Mux({
  tokenId: env.MUX_TOKEN_ID,
  tokenSecret: env.MUX_TOKEN_SECRET,
});

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const uploadId = params.id;

    if (!uploadId) {
      return NextResponse.json(
        { error: 'Upload ID não fornecido' },
        { status: 400 }
      );
    }

    // Buscar o upload do Mux
    const upload = await muxClient.video.uploads.retrieve(uploadId);

    if (!upload || !upload.asset_id) {
      return NextResponse.json(
        { error: 'Upload ainda não processado' },
        { status: 404 }
      );
    }

    // Buscar o asset para obter o playback ID
    const asset = await muxClient.video.assets.retrieve(upload.asset_id);

    if (!asset || !asset.playback_ids || asset.playback_ids.length === 0) {
      return NextResponse.json(
        { error: 'Playback ID não disponível' },
        { status: 404 }
      );
    }

    // Retornar tanto o asset ID quanto o playback ID
    return NextResponse.json({
      asset_id: upload.asset_id,
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