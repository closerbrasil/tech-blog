import { NextResponse } from 'next/server';
import { mcp_neon_run_sql } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
  try {
    const [resultNoticias, resultTotal] = await Promise.all([
      mcp_neon_run_sql({
        params: {
          projectId: process.env.NEON_PROJECT_ID!,
          databaseName: process.env.NEON_DATABASE_NAME || 'neondb',
          sql: `
            SELECT * FROM noticias 
            ORDER BY created_at DESC 
            LIMIT 10
          `
        }
      }),
      mcp_neon_run_sql({
        params: {
          projectId: process.env.NEON_PROJECT_ID!,
          databaseName: process.env.NEON_DATABASE_NAME || 'neondb',
          sql: `SELECT COUNT(*) as total FROM noticias`
        }
      })
    ]);

    return NextResponse.json({ 
      noticias: resultNoticias.rows,
      total: parseInt(resultTotal.rows[0].total)
    });
  } catch (error) {
    console.error('Erro ao buscar notícias:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar notícias' },
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
          INSERT INTO noticias (${fields.join(', ')})
          VALUES (${values.join(', ')})
          RETURNING *
        `
      }
    });

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao criar notícia:', error);
    return NextResponse.json(
      { error: 'Erro ao criar notícia' },
      { status: 500 }
    );
  }
} 