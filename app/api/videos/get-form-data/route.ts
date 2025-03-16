import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { mcp_neon_run_sql } from '@/lib/db';

export async function GET() {
  try {
    const headersList = await headers();
    const origin = headersList.get("origin") || "*";

    // Busca categorias e autores
    const [categoriasResult, autoresResult] = await Promise.all([
      mcp_neon_run_sql({
        params: {
          projectId: process.env.NEON_PROJECT_ID!,
          databaseName: process.env.NEON_DATABASE_NAME || 'neondb',
          sql: 'SELECT id, nome FROM categorias ORDER BY nome'
        }
      }),
      mcp_neon_run_sql({
        params: {
          projectId: process.env.NEON_PROJECT_ID!,
          databaseName: process.env.NEON_DATABASE_NAME || 'neondb',
          sql: 'SELECT id, nome FROM autores ORDER BY nome'
        }
      })
    ]);

    console.log('Dados recuperados:', {
      categorias: categoriasResult.rows,
      autores: autoresResult.rows
    });

    return new NextResponse(
      JSON.stringify({
        categorias: categoriasResult.rows,
        autores: autoresResult.rows,
      }),
      {
        headers: {
          "Access-Control-Allow-Origin": origin,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Erro ao buscar dados do formulário:", error);
    return new NextResponse(
      JSON.stringify({ error: "Erro ao buscar dados do formulário" }),
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
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400",
    },
  });
} 