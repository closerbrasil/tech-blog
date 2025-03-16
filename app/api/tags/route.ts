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
          SELECT * FROM tags 
          ORDER BY created_at DESC
        `
      }
    });

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar tags:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar tags' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const id = uuidv4();
    const fields = ['id', ...Object.keys(data)] as const;
    const values = fields.map(field => {
      if (field === 'id') return `'${id}'`;
      const value = data[field];
      if (value === null || value === undefined) {
        return 'NULL';
      }
      return `'${value}'`;
    });

    const result = await mcp_neon_run_sql({
      params: {
        projectId: process.env.NEON_PROJECT_ID!,
        databaseName: process.env.NEON_DATABASE_NAME || 'neondb',
        sql: `
          INSERT INTO tags (${fields.join(', ')})
          VALUES (${values.join(', ')})
          RETURNING *
        `
      }
    });

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao criar tag:', error);
    return NextResponse.json(
      { error: 'Erro ao criar tag' },
      { status: 500 }
    );
  }
} 