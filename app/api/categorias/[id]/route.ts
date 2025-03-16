import { NextResponse } from 'next/server';
import { mcp_neon_run_sql } from '@/lib/db';

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const result = await mcp_neon_run_sql({
      params: {
        projectId: process.env.NEON_PROJECT_ID!,
        databaseName: process.env.NEON_DATABASE_NAME || 'neondb',
        sql: `
          SELECT * FROM categorias 
          WHERE id = '${params.id}'
        `
      }
    });

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Categoria não encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao buscar categoria' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const data = await request.json();
    const fields = Object.keys(data);
    const setClause = fields.map(field => `${field} = '${data[field]}'`).join(', ');

    const result = await mcp_neon_run_sql({
      params: {
        projectId: process.env.NEON_PROJECT_ID!,
        databaseName: process.env.NEON_DATABASE_NAME || 'neondb',
        sql: `
          UPDATE categorias 
          SET ${setClause}, atualizado_em = NOW()
          WHERE id = '${params.id}'
          RETURNING *
        `
      }
    });

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Categoria não encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao atualizar categoria' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const result = await mcp_neon_run_sql({
      params: {
        projectId: process.env.NEON_PROJECT_ID!,
        databaseName: process.env.NEON_DATABASE_NAME || 'neondb',
        sql: `
          DELETE FROM categorias 
          WHERE id = '${params.id}'
          RETURNING id
        `
      }
    });

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Categoria não encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Categoria excluída com sucesso' });
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao excluir categoria' },
      { status: 500 }
    );
  }
} 