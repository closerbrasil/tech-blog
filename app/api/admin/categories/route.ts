import { NextResponse } from 'next/server';
import { mcp_neon_run_sql } from '@/lib/mcp';

export async function GET() {
  try {
    const result = await mcp_neon_run_sql({
      params: {
        sql: `
          SELECT id, nome as name 
          FROM categorias 
          ORDER BY nome ASC
        `
      }
    });

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar categorias:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar categorias' },
      { status: 500 }
    );
  }
} 