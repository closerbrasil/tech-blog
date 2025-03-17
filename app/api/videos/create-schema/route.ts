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
      // Criar tabela de vídeos se não existir
      await mcp_neon_run_sql({
        params: {
          projectId: process.env.NEON_PROJECT_ID!,
          databaseName: process.env.NEON_DATABASE_NAME || 'neondb',
          sql: `
            CREATE TABLE IF NOT EXISTS videos (
              id UUID PRIMARY KEY,
              titulo VARCHAR(255) NOT NULL,
              conteudo TEXT,
              meta_descricao TEXT,
              slug VARCHAR(255) NOT NULL,
              categoria_id UUID NOT NULL,
              autor_id UUID NOT NULL,
              visibilidade VARCHAR(20) DEFAULT 'PUBLICO',
              video_id VARCHAR(255) NOT NULL,
              plataforma VARCHAR(50) DEFAULT 'mux',
              status VARCHAR(20) DEFAULT 'POSTED',
              recursos JSONB DEFAULT '[]'::jsonb,
              capitulos JSONB DEFAULT '[]'::jsonb,
              thumbnail_url TEXT,
              duracao INTEGER DEFAULT 0,
              visualizacoes INTEGER DEFAULT 0,
              curtidas INTEGER DEFAULT 0,
              publicado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
          `,
        },
      });

      // Criar tabela de categorias se não existir
      await mcp_neon_run_sql({
        params: {
          projectId: process.env.NEON_PROJECT_ID!,
          databaseName: process.env.NEON_DATABASE_NAME || 'neondb',
          sql: `
            CREATE TABLE IF NOT EXISTS categorias (
              id UUID PRIMARY KEY,
              nome VARCHAR(100) NOT NULL,
              descricao TEXT,
              slug VARCHAR(100) NOT NULL,
              meta_descricao TEXT,
              imagem_url TEXT,
              criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
          `,
        },
      });

      // Criar tabela de autores se não existir
      await mcp_neon_run_sql({
        params: {
          projectId: process.env.NEON_PROJECT_ID!,
          databaseName: process.env.NEON_DATABASE_NAME || 'neondb',
          sql: `
            CREATE TABLE IF NOT EXISTS autores (
              id UUID PRIMARY KEY,
              nome VARCHAR(100) NOT NULL,
              bio TEXT,
              avatar_url TEXT,
              email VARCHAR(255),
              website VARCHAR(255),
              redes_sociais JSONB DEFAULT '{}'::jsonb,
              criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
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
                ALTER TABLE videos ADD CONSTRAINT fk_videos_categoria
                FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE CASCADE;
              EXCEPTION
                WHEN duplicate_object THEN null;
              END;

              BEGIN
                ALTER TABLE videos ADD CONSTRAINT fk_videos_autor
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
      message = "Esquema criado com sucesso";
    } catch (dbError: any) {
      details = dbError.message;
      message = "Erro ao criar esquema";
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
        error: "Erro na criação do esquema",
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