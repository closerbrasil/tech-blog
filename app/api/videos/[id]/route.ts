import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { mcp_neon_run_sql } from '@/lib/db';
import { insertVideoSchema } from '@/shared/schema';

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const headersList = await headers();
    const origin = headersList.get("origin") || "*";

    const result = await mcp_neon_run_sql({
      params: {
        projectId: process.env.NEON_PROJECT_ID!,
        databaseName: process.env.NEON_DATABASE_NAME || 'neondb',
        sql: `
          SELECT * FROM videos 
          WHERE id = '${params.id}'
        `
      }
    });

    if (result.rows.length === 0) {
      return new NextResponse(
        JSON.stringify({ error: "Vídeo não encontrado" }),
        {
          status: 404,
          headers: {
            "Access-Control-Allow-Origin": origin,
            "Content-Type": "application/json",
          },
        }
      );
    }

    return new NextResponse(
      JSON.stringify(result.rows[0]),
      {
        headers: {
          "Access-Control-Allow-Origin": origin,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error('Erro ao buscar vídeo:', error);
    return new NextResponse(
      JSON.stringify({ error: "Erro ao buscar vídeo" }),
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

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const headersList = await headers();
    const origin = headersList.get("origin") || "*";

    const data = await request.json();
    const validatedData = insertVideoSchema.partial().parse(data);
    
    // Construir a cláusula SET para a atualização
    const fields = Object.keys(validatedData) as Array<keyof typeof validatedData>;
    const setClause = fields.map(field => {
      const value = validatedData[field];
      if (value === null || value === undefined) {
        return `${field} = NULL`;
      }
      if (typeof value === 'string') return `${field} = '${value.replace(/'/g, "''")}'`;
      if (typeof value === 'object') return `${field} = '${JSON.stringify(value).replace(/'/g, "''")}'`;
      return `${field} = '${value}'`;
    }).join(', ');

    const result = await mcp_neon_run_sql({
      params: {
        projectId: process.env.NEON_PROJECT_ID!,
        databaseName: process.env.NEON_DATABASE_NAME || 'neondb',
        sql: `
          UPDATE videos 
          SET ${setClause}, atualizado_em = NOW()
          WHERE id = '${params.id}'
          RETURNING *
        `
      }
    });

    if (result.rows.length === 0) {
      return new NextResponse(
        JSON.stringify({ error: "Vídeo não encontrado" }),
        {
          status: 404,
          headers: {
            "Access-Control-Allow-Origin": origin,
            "Content-Type": "application/json",
          },
        }
      );
    }

    return new NextResponse(
      JSON.stringify(result.rows[0]),
      {
        headers: {
          "Access-Control-Allow-Origin": origin,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error('Erro ao atualizar vídeo:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('violates foreign key constraint')) {
        return new NextResponse(
          JSON.stringify({ 
            error: "Erro de referência",
            details: "O valor de categoria_id ou autor_id não corresponde a registros existentes."
          }),
          {
            status: 400,
            headers: {
              "Access-Control-Allow-Origin": origin,
              "Content-Type": "application/json",
            },
          }
        );
      }
    }

    return new NextResponse(
      JSON.stringify({ error: "Erro ao atualizar vídeo" }),
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

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const headersList = await headers();
    const origin = headersList.get("origin") || "*";

    const result = await mcp_neon_run_sql({
      params: {
        projectId: process.env.NEON_PROJECT_ID!,
        databaseName: process.env.NEON_DATABASE_NAME || 'neondb',
        sql: `
          DELETE FROM videos 
          WHERE id = '${params.id}'
          RETURNING id
        `
      }
    });

    if (result.rows.length === 0) {
      return new NextResponse(
        JSON.stringify({ error: "Vídeo não encontrado" }),
        {
          status: 404,
          headers: {
            "Access-Control-Allow-Origin": origin,
            "Content-Type": "application/json",
          },
        }
      );
    }

    return new NextResponse(
      JSON.stringify({ message: "Vídeo excluído com sucesso" }),
      {
        headers: {
          "Access-Control-Allow-Origin": origin,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error('Erro ao excluir vídeo:', error);
    return new NextResponse(
      JSON.stringify({ error: "Erro ao excluir vídeo" }),
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
      "Access-Control-Allow-Methods": "GET, PATCH, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400",
    },
  });
} 