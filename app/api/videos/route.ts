import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { mcp_neon_run_sql } from '@/lib/db';
import { insertVideoSchema, videoInputSchema } from '@/shared/schema';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
  try {
    const headersList = await headers();
    const origin = headersList.get("origin") || "*";

    const result = await mcp_neon_run_sql({
      params: {
        sql: `
          SELECT 
            v.*,
            c.nome as categoria_nome,
            c.cor as categoria_cor,
            a.nome as autor_nome,
            a.avatar_url as autor_avatar_url,
            a.cargo as autor_cargo
          FROM videos v
          LEFT JOIN videos_categorias vc ON v.id = vc.video_id
          LEFT JOIN categorias c ON vc.categoria_id = c.id
          LEFT JOIN autores a ON v.autor_id = a.id
          ORDER BY v.criado_em DESC
          LIMIT 12
        `
      }
    });

    // Transform the results to include nested objects
    const videos = result.rows.map(row => ({
      ...row,
      categorias: row.categoria_nome ? {
        id: row.categoria_id,
        nome: row.categoria_nome,
        cor: row.categoria_cor
      } : undefined,
      autores: row.autor_nome ? {
        id: row.autor_id,
        nome: row.autor_nome,
        avatar_url: row.autor_avatar_url,
        cargo: row.autor_cargo
      } : undefined
    }));

    return new NextResponse(
      JSON.stringify({
        videos,
        total: videos.length,
      }),
      {
        headers: {
          "Access-Control-Allow-Origin": origin,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    return new NextResponse(
      JSON.stringify({ 
        error: "Erro ao buscar vídeos",
        videos: [],
        total: 0
      }),
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

export async function POST(request: Request) {
  try {
    const headersList = await headers();
    const origin = headersList.get("origin") || "*";

    const data = await request.json();
    const validatedData = insertVideoSchema.parse({
      ...data,
      status: data.status || 'PRIVATE',
      meta_descricao: data.meta_descricao || data.descricao,
      transcricao: data.transcricao || data.descricao,
      keywords: data.keywords || [],
      origem: data.origem || 'mux'
    });

    const now = new Date().toISOString();

    const result = await mcp_neon_run_sql({
      params: {
        sql: `
          INSERT INTO videos (
            titulo,
            descricao,
            transcricao,
            youtube_url,
            url_video,
            asset_id,
            playback_id,
            track_id,
            origem,
            status,
            slug,
            thumbnail_url,
            criado_em,
            atualizado_em
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14
          )
          RETURNING id
        `,
        values: [
          validatedData.titulo,
          validatedData.descricao,
          validatedData.transcricao,
          validatedData.youtube_url,
          validatedData.url_video,
          validatedData.asset_id,
          validatedData.playback_id,
          validatedData.track_id,
          validatedData.origem,
          validatedData.status,
          validatedData.slug,
          validatedData.thumbnail_url,
          now,
          now
        ]
      }
    });

    return new NextResponse(
      JSON.stringify(result.rows[0]),
      {
        status: 201,
        headers: {
          "Access-Control-Allow-Origin": origin,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error('Erro ao criar vídeo:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('violates foreign key constraint')) {
        return new NextResponse(
          JSON.stringify({ 
            error: "Erro de referência",
            details: "O valor de categoria_id não corresponde a um registro existente."
          }),
          {
            status: 400,
            headers: {
              "Access-Control-Allow-Origin": "*",
              "Content-Type": "application/json",
            },
          }
        );
      }
    }

    return new NextResponse(
      JSON.stringify({ 
        error: "Erro ao criar vídeo",
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      }),
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
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400",
    },
  });
} 