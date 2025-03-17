import { Pool, QueryResult as PgQueryResult } from '@neondatabase/serverless';

// Interfaces
interface MCP_RunSQLParams {
  params: {
    sql: string;
    values?: any[];
    projectId?: string;
    databaseName?: string;
  };
}

// Configuração do pool de conexões
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: true }
    : false
});

// Função principal de execução SQL
export async function mcp_neon_run_sql({ params }: MCP_RunSQLParams): Promise<PgQueryResult> {
  try {
    const { sql, values } = params;
    const result = await pool.query(sql, values);
    return result;
  } catch (error) {
    console.error('Error executing SQL:', error);
    throw error;
  }
}

// Função para transações
export async function mcp_neon_run_sql_transaction({ params }: { 
  params: { 
    sqlStatements: string[];
    values?: any[][];
    projectId?: string;
    databaseName?: string;
  } 
}): Promise<PgQueryResult[]> {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const results = [];
    for (let i = 0; i < params.sqlStatements.length; i++) {
      const sql = params.sqlStatements[i];
      const values = params.values?.[i];
      const result = await client.query(sql, values);
      results.push(result);
    }
    
    await client.query('COMMIT');
    return results;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error executing transaction:', error);
    throw error;
  } finally {
    client.release();
  }
}

export async function apiRequest<T = any>(
url: string, p0: string, p1: { tagId: string; }, options: RequestInit = {}): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
} 