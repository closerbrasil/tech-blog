import { NextResponse } from "next/server";
import Mux from "@mux/mux-node";

const muxClient = new Mux({
  tokenId: process.env.MUX_TOKEN_ID || '',
  tokenSecret: process.env.MUX_TOKEN_SECRET || '',
});

export async function DELETE(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    // O ID recebido é o asset_id do Mux
    const { id } = await props.params;

    try {
      // Deletar o vídeo no Mux
      await muxClient.video.assets.delete(id);
      return new NextResponse(null, { status: 204 });
    } catch (error) {
      console.error("Erro ao excluir vídeo no Mux:", error);
      
      // Verificar erro sem usar any e non-null assertion
      if (error instanceof Error && error.message && error.message.includes("not_found")) {
        return new NextResponse("Vídeo não encontrado no Mux", { status: 404 });
      }

      return new NextResponse("Erro ao excluir vídeo no Mux", { status: 500 });
    }
  } catch (error) {
    console.error("Erro ao processar requisição:", error);
    return new NextResponse("Erro interno do servidor", { status: 500 });
  }
} 