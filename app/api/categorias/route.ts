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
          SELECT 
            id,
            nome,
            parent_id,
            slug,
            descricao,
            image_url as imagem_url,
            cor,
            criado_em,
            atualizado_em
          FROM categorias
          ORDER BY 
            CASE WHEN parent_id IS NULL THEN 0 ELSE 1 END,
            nome;
        `
      }
    });

    if (!result?.rows) {
      throw new Error('Nenhuma categoria encontrada');
    }

    console.log('Categorias encontradas:', result.rows); // Log para debug
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar categorias:', error);
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
    
    // Gerar slug a partir do nome se não fornecido
    if (!data.slug && data.nome) {
      data.slug = data.nome
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    }

    const result = await mcp_neon_run_sql({
      params: {
        projectId: process.env.NEON_PROJECT_ID!,
        databaseName: process.env.NEON_DATABASE_NAME || 'neondb',
        sql: `
          INSERT INTO categorias (id, nome, slug, descricao, parent_id)
          VALUES ($1, $2, $3, $4, $5)
          RETURNING *
        `,
        values: [id, data.nome, data.slug, data.descricao || null, data.parent_id || null]
      }
    });

    if (!result?.rows?.[0]) {
      throw new Error('Erro ao criar categoria');
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao criar categoria:', error);
    return NextResponse.json(
      { 
        error: 'Erro ao criar categoria',
        message: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
} 