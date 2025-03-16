import { NextResponse } from 'next/server';
import { mcp_neon_run_sql } from '@/lib/db';
import { insertAutorSchema } from '@/shared/schema';

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
          SELECT * FROM autores 
          WHERE id = '${params.id}'
        `
      }
    });

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Autor não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao buscar autor' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const data = await request.json();
    const validatedData = insertAutorSchema.partial().parse(data);
    const fields = Object.keys(validatedData) as Array<keyof typeof validatedData>;
    const setClause = fields.map(field => {
      const value = validatedData[field];
      if (value === null || value === undefined) {
        return `${field} = NULL`;
      }
      return `${field} = '${value}'`;
    }).join(', ');

    const result = await mcp_neon_run_sql({
      params: {
        projectId: process.env.NEON_PROJECT_ID!,
        databaseName: process.env.NEON_DATABASE_NAME || 'neondb',
        sql: `
          UPDATE autores 
          SET ${setClause}, atualizado_em = NOW()
          WHERE id = '${params.id}'
          RETURNING *
        `
      }
    });

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Autor não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao atualizar autor' },
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
          DELETE FROM autores 
          WHERE id = '${params.id}'
          RETURNING id
        `
      }
    });

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Autor não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Autor excluído com sucesso' });
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao excluir autor' },
      { status: 500 }
    );
  }
} 