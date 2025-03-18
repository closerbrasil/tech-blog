import { NextResponse } from "next/server";
import { headers } from "next/headers";
import Mux from "@mux/mux-node";

// Inicializa o cliente Mux corretamente
const muxClient = new Mux({
  tokenId: process.env.MUX_TOKEN_ID || "",
  tokenSecret: process.env.MUX_TOKEN_SECRET || "",
});

export async function GET() {
  try {
    if (!process.env.MUX_TOKEN_ID || !process.env.MUX_TOKEN_SECRET) {
      throw new Error("Credenciais do Mux não configuradas");
    }

    // Obtém os headers de forma assíncrona
    const headersList = await headers();
    const origin = headersList.get("origin") || "*";

    const upload = await muxClient.video.uploads.create({
      cors_origin: origin,
      new_asset_settings: {
        playback_policy: ["public"],
        mp4_support: "standard",
        normalize_audio: true,
        test: false
      },
    });

    return new NextResponse(JSON.stringify(upload), {
      headers: {
        "Access-Control-Allow-Origin": origin,
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Erro ao gerar token de upload:", error);
    return new NextResponse(
      JSON.stringify({ error: "Erro ao gerar token de upload" }),
      {
        status: 500,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json",
        },
      }
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