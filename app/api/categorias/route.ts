import { NextResponse } from 'next/server';
import { mcp_neon_run_sql } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
  try {
    const result = await mcp_neon_run_sql({
      params: {
        projectId: process.env.NEON_PROJECT_ID!,
        databaseName: process.env.NEON_DATABASE_NAME || 'neondb',
        sql: `
          SELECT * FROM categorias 
          ORDER BY nome ASC
        `
      }
    });

    return NextResponse.json(result.rows);
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao buscar categorias' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const id = uuidv4();
    const fields = Object.keys(data);
    const values = Object.values(data);
    const fieldsClause = ['id', ...fields].join(', ');
    const valuesClause = [`'${id}'`, ...values.map(value => `'${value}'`)].join(', ');

    const result = await mcp_neon_run_sql({
      params: {
        projectId: process.env.NEON_PROJECT_ID!,
        databaseName: process.env.NEON_DATABASE_NAME || 'neondb',
        sql: `
          INSERT INTO categorias (${fieldsClause})
          VALUES (${valuesClause})
          RETURNING *
        `
      }
    });

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao criar categoria' },
      { status: 500 }
    );
  }
} 