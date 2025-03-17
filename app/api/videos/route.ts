import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { mcp_neon_run_sql } from '@/lib/db';
import { insertVideoSchema } from '@/shared/schema';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
  try {
    const headersList = await headers();
    const origin = headersList.get("origin") || "*";

    const result = await mcp_neon_run_sql({
      params: {
        projectId: process.env.NEON_PROJECT_ID!,
        databaseName: process.env.NEON_DATABASE_NAME || 'neondb',
        sql: `
          SELECT * FROM videos 
          WHERE status = 'publicado' AND visibilidade = 'publico'
          ORDER BY criado_em DESC
        `
      }
    });

    return new NextResponse(
      JSON.stringify({
        videos: result.rows,
        total: result.rows.length,
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
      status: data.status || 'rascunho',
      visibilidade: data.visibilidade || 'privado',
      meta_descricao: data.meta_descricao || data.descricao,
      transcricao: data.transcricao || data.descricao,
      keywords: data.keywords || [],
      origem: data.origem || 'mux'
    });

    const id = uuidv4();
    const now = new Date().toISOString();
    
    // Preparar campos e valores para a inserção
    const fields = ['id', 'criado_em', 'atualizado_em', ...Object.keys(validatedData)];
    const values = fields.map(field => {
      if (field === 'id') return `'${id}'`;
      if (field === 'criado_em' || field === 'atualizado_em') return `'${now}'`;
      
      const value = validatedData[field as keyof typeof validatedData];
      if (value === null || value === undefined) {
        return 'NULL';
      }
      if (typeof value === 'string') return `'${value.replace(/'/g, "''")}'`;
      if (typeof value === 'object') return `'${JSON.stringify(value).replace(/'/g, "''")}'`;
      return `'${value}'`;
    });

    const result = await mcp_neon_run_sql({
      params: {
        projectId: process.env.NEON_PROJECT_ID!,
        databaseName: process.env.NEON_DATABASE_NAME || 'neondb',
        sql: `
          INSERT INTO videos (${fields.join(', ')})
          VALUES (${values.join(', ')})
          RETURNING *
        `
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