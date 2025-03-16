import { NextResponse } from 'next/server';
import { mcp_neon_run_sql } from '@/lib/db';
import { insertAutorSchema } from '@/shared/schema';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
  try {
    const result = await mcp_neon_run_sql({
      params: {
        projectId: process.env.NEON_PROJECT_ID!,
        databaseName: process.env.NEON_DATABASE_NAME || 'neondb',
        sql: `
          SELECT * FROM autores 
          ORDER BY nome ASC
        `
      }
    });

    return NextResponse.json(result.rows);
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao buscar autores' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const validatedData = insertAutorSchema.parse(data);
    const id = uuidv4();
    const fields = ['id', ...Object.keys(validatedData)] as const;
    const values = fields.map(field => {
      if (field === 'id') return `'${id}'`;
      const value = validatedData[field as keyof typeof validatedData];
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
          INSERT INTO autores (${fields.join(', ')})
          VALUES (${values.join(', ')})
          RETURNING *
        `
      }
    });

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao criar autor' },
      { status: 500 }
    );
  }
} 