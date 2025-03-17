import { mcp_neon_run_sql, mcp_neon_run_sql_transaction } from './mcp';

// Re-export MCP functions for backward compatibility
export { mcp_neon_run_sql, mcp_neon_run_sql_transaction };

// Interfaces para os tipos de dados
export interface VideoRow {
  id: string;
  created_at: Date;
  updated_at: Date;
  video_id: string;
  plataforma: string;
  titulo: string;
  descricao: string;
  thumbnail_url: string;
  embed_url: string;
  duracao: number;
  autor_id: string;
  categoria_id: string;
  visualizacoes: number;
  curtidas: number;
  publicado: boolean;
  status: 'PUBLIC' | 'PRIVATE';
  publicado_em?: Date;
  meta_descricao: string;
  conteudo: string;
  recursos: string;
  capitulos: string;
  autores?: {
    id: string;
    nome: string;
    avatar_url: string;
    cargo: string;
  };
  categorias?: {
    id: string;
    nome: string;
    cor: string;
  };
}

// Interface para opções de consulta
export interface FindManyOptions {
  where?: Record<string, any>;
  orderBy?: Record<string, 'asc' | 'desc'>;
  take?: number;
  include?: {
    autores?: boolean;
    categorias?: boolean;
  };
}

export interface FindUniqueOptions {
  where: Record<string, any>;
  include?: {
    autores?: boolean;
    categorias?: boolean;
  };
}

// Exporta o objeto db com os métodos de acesso ao banco
export const db = {
  video: {
    async findMany(options?: FindManyOptions): Promise<VideoRow[]> {
      const values: any[] = [];
      let paramIndex = 1;
      let query = `
        SELECT 
          v.*,
          ${options?.include?.autores ? 'a.nome as autor_nome, a.avatar_url as autor_avatar_url,' : ''}
          ${options?.include?.categorias ? 'c.nome as categoria_nome, c.cor as categoria_cor,' : ''}
          v.*
        FROM videos v
        ${options?.include?.autores ? 'LEFT JOIN autores a ON v.autor_id = a.id' : ''}
        ${options?.include?.categorias ? 'LEFT JOIN videos_categorias vc ON v.id = vc.video_id LEFT JOIN categorias c ON vc.categoria_id = c.id' : ''}
      `;

      if (options?.where) {
        const conditions = Object.entries(options.where).map(([key, value]) => {
          values.push(value);
          return `v.${key} = $${paramIndex++}`;
        });
        
        if (conditions.length > 0) {
          query += ` WHERE ${conditions.join(' AND ')}`;
        }
      }

      if (options?.orderBy) {
        const orderClauses = Object.entries(options.orderBy)
          .map(([field, direction]) => `v.${field} ${direction}`)
          .join(', ');
        query += ` ORDER BY ${orderClauses}`;
      }

      if (options?.take) {
        query += ` LIMIT ${options.take}`;
      }

      const result = await mcp_neon_run_sql({
        params: {
          sql: query,
          values
        }
      });

      return result.rows;
    },

    async findUnique(options: FindUniqueOptions): Promise<VideoRow | null> {
      if (!options?.where) return null;

      const values: any[] = [];
      let paramIndex = 1;
      let query = `
        SELECT 
          v.*,
          ${options?.include?.autores ? 'a.nome as autor_nome, a.avatar_url as autor_avatar_url,' : ''}
          ${options?.include?.categorias ? 'c.nome as categoria_nome, c.cor as categoria_cor,' : ''}
          v.*
        FROM videos v
        ${options?.include?.autores ? 'LEFT JOIN autores a ON v.autor_id = a.id' : ''}
        ${options?.include?.categorias ? 'LEFT JOIN videos_categorias vc ON v.id = vc.video_id LEFT JOIN categorias c ON vc.categoria_id = c.id' : ''}
      `;

      const conditions = Object.entries(options.where).map(([key, value]) => {
        values.push(value);
        return `v.${key} = $${paramIndex++}`;
      });

      query += ` WHERE ${conditions.join(' AND ')}`;
      query += ' LIMIT 1';

      const result = await mcp_neon_run_sql({
        params: {
          sql: query,
          values
        }
      });

      if (!result.rows[0]) return null;

      const video = result.rows[0];

      // Transform the result to match the expected structure
      if (options?.include?.autores && video.autor_id) {
        video.autores = {
          id: video.autor_id,
          nome: video.autor_nome || '',
          avatar_url: video.autor_avatar_url || '',
          cargo: video.autor_cargo || ''
        };
      }

      if (options?.include?.categorias && video.categoria_id) {
        video.categorias = {
          id: video.categoria_id,
          nome: video.categoria_nome || '',
          cor: video.categoria_cor || ''
        };
      }

      return video;
    }
  }
}; 