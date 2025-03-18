import { NextResponse } from 'next/server';
import { mcp_neon_run_sql } from '@/lib/mcp';

// Declaração global para processingQueue
declare global {
  var processingQueue: Record<string, Promise<void>>;
}

// Funções auxiliares para evitar duplicação de código
async function updateVideoStatus(videoId: string, status: string, errorMessage?: string) {
  // Mapeia estados personalizados para os estados permitidos no banco
  let dbStatus = status;
  
  // Verifica quais valores são permitidos pelo CHECK constraint
  if (status === 'downloading' || status === 'uploading') {
    dbStatus = 'waiting'; // Use 'waiting' como valor de fallback se os outros não forem permitidos
  }
  
  console.log(`🔄 Atualizando status do vídeo ${videoId} para: ${status} (DB: ${dbStatus})`);
  
  const sqlParams = {
    projectId: process.env.NEON_PROJECT_ID || 'green-frost-95083568',
    databaseName: process.env.NEON_DATABASE_NAME || 'neondb',
    sql: `
      UPDATE videos 
      SET processing_status = $1
      ${errorMessage ? ', error = $2' : ''}
      WHERE id = ${errorMessage ? '$3' : '$2'}
    `,
    values: errorMessage 
      ? [dbStatus, errorMessage, videoId] 
      : [dbStatus, videoId]
  };

  await mcp_neon_run_sql({ params: sqlParams });
  console.log(`✅ Status do vídeo ${videoId} atualizado para: ${dbStatus}`);
}

// Definição do tipo para a função importada
type ProcessVideoAsyncFn = (url: string, videoId: string, categoryId: string) => Promise<void>;

// Função para iniciar o processamento do próximo vídeo na fila
async function startNextVideoInQueue(): Promise<void> {
  try {
    // Busca o próximo vídeo com status 'waiting'
    const nextVideoResult = await mcp_neon_run_sql({
      params: {
        projectId: process.env.NEON_PROJECT_ID || 'green-frost-95083568',
        databaseName: process.env.NEON_DATABASE_NAME || 'neondb',
        sql: `
          SELECT v.id, v.youtube_url, vc.categoria_id
          FROM videos v
          LEFT JOIN videos_categorias vc ON v.id = vc.video_id
          WHERE v.processing_status = 'waiting'
          ORDER BY v.created_at ASC
          LIMIT 1
        `
      }
    });
    
    if (nextVideoResult.rows.length === 0) {
      console.log('✅ Nenhum vídeo na fila de espera');
      return;
    }
    
    const video = nextVideoResult.rows[0];
    console.log(`🚀 Iniciando processamento manual do vídeo na fila: ${video.id}`);
    
    // Atualiza o status para simular início do processamento
    await updateVideoStatus(video.id, 'downloading');
    
    // Importa dinamicamente a função necessária do arquivo principal
    // Isso evita duplicação de código e mantém a lógica em um só lugar
    const { processVideoAsync } = await import('@/app/api/admin/youtube-downloader/route') as { processVideoAsync: ProcessVideoAsyncFn };
    
    // Inicia o processamento deste vídeo
    if (!global.processingQueue) {
      global.processingQueue = {};
    }
    
    global.processingQueue[video.id] = processVideoAsync(video.youtube_url, video.id, video.categoria_id)
      .then(() => {
        console.log(`✅ Processamento do vídeo ${video.id} finalizado com sucesso`);
        delete global.processingQueue[video.id];
        
        // Depois que este vídeo terminar, inicia o próximo na fila
        startNextVideoInQueue();
      })
      .catch((error: Error) => {
        console.error(`❌ Erro no processamento assíncrono do vídeo ${video.id}:`, error);
        delete global.processingQueue[video.id];
        
        // Mesmo em caso de erro, continua para o próximo vídeo
        startNextVideoInQueue();
      });
  } catch (error) {
    console.error('❌ Erro ao iniciar próximo vídeo na fila:', error);
  }
}

// Endpoint para forçar o processamento dos vídeos em fila
export async function POST() {
  try {
    // Verifica se já existem vídeos em processamento
    const processingVideos = await mcp_neon_run_sql({
      params: {
        projectId: process.env.NEON_PROJECT_ID || 'green-frost-95083568',
        databaseName: process.env.NEON_DATABASE_NAME || 'neondb',
        sql: `
          SELECT COUNT(*) as count
          FROM videos 
          WHERE processing_status = 'waiting'
          AND created_at > (NOW() - INTERVAL '1 hour')
        `
      }
    });
    
    const waitingCount = parseInt(processingVideos.rows[0].count || '0');
    
    if (waitingCount === 0) {
      return NextResponse.json({
        success: false,
        message: 'Não há vídeos aguardando processamento'
      });
    }
    
    // Inicia o processamento do próximo vídeo na fila
    setTimeout(() => {
      startNextVideoInQueue()
        .catch((error: Error) => {
          console.error('❌ Erro ao iniciar processamento de vídeos:', error);
        });
    }, 100);
    
    return NextResponse.json({
      success: true,
      message: `Iniciando processamento de ${waitingCount} vídeos em fila`,
      count: waitingCount
    });
  } catch (error) {
    console.error('❌ Erro ao processar vídeos em fila:', error);
    return NextResponse.json(
      { error: 'Erro ao processar vídeos em fila' },
      { status: 500 }
    );
  }
} 