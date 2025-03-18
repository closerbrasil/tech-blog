import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { mcp_neon_run_sql } from '@/lib/db';

export async function POST() {
  try {
    const headersList = await headers();
    const origin = headersList.get("origin") || "*";
    
    let message = "Erro ao conectar ao banco de dados";
    let success = false;
    let details = null;
    let tables: string[] = [];

    try {
      // Criar tabela de notícias se não existir
      await mcp_neon_run_sql({
        params: {
          projectId: process.env.NEON_PROJECT_ID!,
          databaseName: process.env.NEON_DATABASE_NAME || 'neondb',
          sql: `
            CREATE TABLE IF NOT EXISTS noticias (
              id UUID PRIMARY KEY,
              titulo VARCHAR(255) NOT NULL,
              slug VARCHAR(255) NOT NULL,
              conteudo TEXT,
              image_url TEXT,
              imagem_credito TEXT,
              imagem_alt TEXT,
              autor_id UUID NOT NULL,
              categoria_id UUID NOT NULL,
              meta_descricao TEXT,
              palavra_chave TEXT,
              tempo_leitura TEXT,
              status VARCHAR(20) DEFAULT 'PRIVATE' CHECK (status IN ('PUBLIC', 'PRIVATE')),
              schema_type VARCHAR(20) DEFAULT 'Article' CHECK (schema_type IN ('Article', 'NewsArticle', 'BlogPosting')),
              publicado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
          `,
        },
      });

      // Adicionar foreign keys
      await mcp_neon_run_sql({
        params: {
          projectId: process.env.NEON_PROJECT_ID!,
          databaseName: process.env.NEON_DATABASE_NAME || 'neondb',
          sql: `
            DO $$
            BEGIN
              BEGIN
                ALTER TABLE noticias ADD CONSTRAINT fk_noticias_categoria
                FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE CASCADE;
              EXCEPTION
                WHEN duplicate_object THEN null;
              END;

              BEGIN
                ALTER TABLE noticias ADD CONSTRAINT fk_noticias_autor
                FOREIGN KEY (autor_id) REFERENCES autores(id) ON DELETE CASCADE;
              EXCEPTION
                WHEN duplicate_object THEN null;
              END;
            END $$;
          `,
        },
      });

      // Verificar tabelas criadas
      const tablesResult = await mcp_neon_run_sql({
        params: {
          projectId: process.env.NEON_PROJECT_ID!,
          databaseName: process.env.NEON_DATABASE_NAME || 'neondb',
          sql: `
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
            ORDER BY table_name;
          `,
        },
      });

      tables = tablesResult.rows.map((row: { table_name: string }) => row.table_name);
      success = true;
      message = "Esquema de notícias criado com sucesso";
    } catch (dbError: any) {
      details = dbError.message;
      message = "Erro ao criar esquema de notícias";
    }

    return new NextResponse(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        success,
        message,
        details,
        tables
      }),
      {
        headers: {
          "Access-Control-Allow-Origin": origin,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error: any) {
    console.error("Erro geral na criação do esquema:", error);
    
    return new NextResponse(
      JSON.stringify({ 
        error: "Erro na criação do esquema de notícias",
        details: error.message
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
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400",
    },
  });
} 