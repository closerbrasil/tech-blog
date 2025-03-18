import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';
import { mcp_neon_run_sql } from '@/lib/mcp';
import Mux from '@mux/mux-node';
import { slugify } from '../../../../lib/slugify';

const execAsync = promisify(exec);

// Inicializa o cliente do Mux
const mux = new Mux({
  tokenId: process.env.MUX_TOKEN_ID || '',
  tokenSecret: process.env.MUX_TOKEN_SECRET || ''
});

// Adicionar esta declaração global na parte superior do arquivo
declare global {
  var processingQueue: Record<string, Promise<void>>;
}

// Funções auxiliares
async function getAvailableFormats(url: string): Promise<string> {
  const command = `yt-dlp -F "${url}"`;
  const { stdout } = await execAsync(command);
  return stdout;
}

async function findPortugueseAudioId(formats: string): Promise<string | null> {
  const lines = formats.split('\n');
  for (const line of lines) {
    if ((line.includes('[pt]') || line.includes('[pt-BR]')) && line.includes('audio only')) {
      const id = line.split(' ')[0];
      return id;
    }
  }
  return null;
}

async function findBestVideoId(formats: string): Promise<string> {
  const lines = formats.split('\n');
  let bestVideoId = '';
  
  for (const line of lines) {
    if (line.includes('1080p') && line.includes('video only')) {
      const id = line.split(' ')[0];
      bestVideoId = id;
      break;
    }
  }
  
  if (!bestVideoId) {
    for (const line of lines) {
      if (line.includes('video only')) {
        const id = line.split(' ')[0];
        bestVideoId = id;
        break;
      }
    }
  }
  
  return bestVideoId;
}

async function uploadToMux(filePath: string): Promise<{ asset_id: string; playback_id: string; track_id?: string }> {
  // Cria um novo upload direto
  const upload = await mux.video.uploads.create({
    new_asset_settings: {
      playback_policy: ['public'],
      video_quality: 'plus',
      max_resolution_tier: '1080p',
      input: [
        {
          generated_subtitles: [
            {
              language_code: "pt",
              name: "Português (gerado automaticamente)"
            }
          ]
        }
      ]
    },
    cors_origin: '*'
  });

  if (!upload || !upload.url) {
    throw new Error('Falha ao criar upload no Mux: URL de upload não recebida');
  }

  // Prepara o upload
  const fileSize = fs.statSync(filePath).size;

  try {
    // Faz o upload do arquivo usando a API nativa do Node.js
    const fileContent = fs.readFileSync(filePath);
    const response = await fetch(upload.url, {
      method: 'PUT',
      body: fileContent,
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Length': fileSize.toString()
      }
    });

    if (!response.ok) {
      throw new Error(`Upload falhou com status ${response.status}: ${response.statusText}`);
    }

    console.log('✅ Upload do arquivo concluído');
  } catch (error) {
    console.error('❌ Erro no upload:', error);
    throw error;
  }

  // Aguarda o upload ser processado e o asset ser criado
  let asset;
  let attempts = 0;
  const maxAttempts = 30; // 5 minutos (10 segundos * 30 tentativas)

  while (attempts < maxAttempts) {
    const uploadStatus = await mux.video.uploads.retrieve(upload.id);
    console.log(`⏳ Status do upload: ${uploadStatus.status}`);
    
    if (uploadStatus.asset_id) {
      asset = await mux.video.assets.retrieve(uploadStatus.asset_id);
      break;
    }

    await new Promise(resolve => setTimeout(resolve, 10000)); // Espera 10 segundos
    attempts++;
    console.log(`⏳ Aguardando processamento do vídeo... Tentativa ${attempts}/${maxAttempts}`);
  }

  if (!asset) {
    throw new Error('Timeout ao aguardar o processamento do vídeo');
  }

  if (!asset.id) {
    throw new Error('Asset ID não recebido do Mux após processamento');
  }

  // Cria um playback ID público se ainda não existir
  let playbackId = asset.playback_ids?.[0]?.id;
  if (!playbackId) {
    const playbackResponse = await mux.video.assets.createPlaybackId(asset.id, {
      policy: 'public'
    });
    playbackId = playbackResponse.id;
  }

  if (!playbackId) {
    throw new Error('Não foi possível obter o Playback ID do Mux');
  }

  // Aguarda a legenda ser gerada
  let trackId;
  if (asset.tracks) {
    const textTrack = asset.tracks.find(track => 
      track.type === 'text' && 
      track.text_source === 'generated_vod' &&
      track.language_code === 'pt'
    );
    if (textTrack) {
      trackId = textTrack.id;
    }
  }

  return {
    asset_id: asset.id,
    playback_id: playbackId,
    track_id: trackId
  };
}

async function getVideoMetadata(url: string): Promise<{ title: string; description: string; thumbnailUrl: string }> {
  const command = `yt-dlp "${url}" --get-title --get-description --get-thumbnail`;
  const { stdout } = await execAsync(command);
  const [title, ...lines] = stdout.trim().split('\n');
  const thumbnailUrl = lines.pop() || '';
  return {
    title: title || '',
    description: lines.join('\n') || '',
    thumbnailUrl
  };
}

async function getVideoTranscription(url: string): Promise<string> {
  const downloadsDir = path.join(process.cwd(), 'downloads');
  const tempSubsPath = path.join(downloadsDir, 'temp_subs');
  
  try {
    // Baixa a legenda em português usando TTML e converte para SRT
    const command = `yt-dlp "${url}" --skip-download --write-subs --write-auto-subs --sub-lang "pt,pt-BR" --sub-format ttml --convert-subs srt -o "${tempSubsPath}"`;
    await execAsync(command);

    // Procura pelo arquivo de legenda gerado
    const files = fs.readdirSync(downloadsDir);
    const subsFile = files.find(file => 
      file.startsWith('temp_subs') && 
      (file.endsWith('.pt.srt') || file.endsWith('.pt-BR.srt'))
    );

    if (!subsFile) {
      console.log('⚠️ Nenhuma legenda em português encontrada');
      return '';
    }

    // Lê o conteúdo da legenda
    const subsPath = path.join(downloadsDir, subsFile);
    let transcription = fs.readFileSync(subsPath, 'utf-8');

    // Remove timestamps e números de sequência
    transcription = transcription
      .split('\n')
      .filter(line => 
        !line.match(/^\d+$/) && // Remove números de sequência
        !line.match(/^\d{2}:\d{2}:\d{2},\d{3} --> \d{2}:\d{2}:\d{2},\d{3}$/) && // Remove timestamps
        line.trim() !== '' // Remove linhas vazias
      )
      .join(' ')
      .replace(/<[^>]*>/g, ''); // Remove tags HTML

    // Remove o arquivo temporário
    fs.unlinkSync(subsPath);

    return transcription.trim();
  } catch (error) {
    console.error('❌ Erro ao obter transcrição:', error);
    return '';
  }
}

async function saveToDatabase(data: {
  title: string;
  description: string;
  transcription: string;
  youtube_url: string;
  url_storage: string;
  category_id: string;
  additional_categories?: string[];
  asset_id: string;
  playback_id: string;
  track_id?: string;
}): Promise<void> {
  const now = new Date().toISOString();
  const slug = data.title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  const thumbnail_url = data.playback_id 
    ? `https://image.mux.com/${data.playback_id}/thumbnail.jpg`
    : null;

  // Inserir o vídeo
  const videoResult = await mcp_neon_run_sql({
    params: {
      projectId: process.env.NEON_PROJECT_ID || 'green-frost-95083568',
      databaseName: process.env.NEON_DATABASE_NAME || 'neondb',
      sql: `
        INSERT INTO videos (
          id,
          titulo,
          descricao,
          transcricao,
          youtube_url,
          url_video,
          asset_id,
          playback_id,
          track_id,
          origem,
          status,
          slug,
          thumbnail_url,
          criado_em,
          atualizado_em
        )
        VALUES (
          gen_random_uuid(),
          $1,
          $2,
          $3,
          $4,
          $5,
          $6,
          $7,
          $8,
          'youtube',
          'PRIVATE',
          $9,
          $10,
          $11,
          $11
        )
        RETURNING id
      `,
      values: [
        data.title,
        data.description,
        data.transcription,
        data.youtube_url,
        data.url_storage,
        data.asset_id,
        data.playback_id,
        data.track_id || null,
        slug,
        thumbnail_url,
        now
      ]
    }
  });

  if (!videoResult?.rows?.[0]?.id) {
    throw new Error('Falha ao salvar o vídeo no banco de dados');
  }

  const videoId = videoResult.rows[0].id;

  // Inserir a categoria principal
  await mcp_neon_run_sql({
    params: {
      projectId: process.env.NEON_PROJECT_ID || 'green-frost-95083568',
      databaseName: process.env.NEON_DATABASE_NAME || 'neondb',
      sql: `
        INSERT INTO videos_categorias (video_id, categoria_id)
        VALUES ($1, $2)
      `,
      values: [videoId, data.category_id]
    }
  });

  // Inserir categorias adicionais
  if (data.additional_categories?.length) {
    const additionalCategoriesValues = data.additional_categories
      .map((_, i) => `($1, $${i + 2})`)
      .join(', ');

    await mcp_neon_run_sql({
      params: {
        projectId: process.env.NEON_PROJECT_ID || 'green-frost-95083568',
        databaseName: process.env.NEON_DATABASE_NAME || 'neondb',
        sql: `
          INSERT INTO videos_categorias (video_id, categoria_id)
          VALUES ${additionalCategoriesValues}
        `,
        values: [videoId, ...data.additional_categories]
      }
    });
  }

  console.log('✅ Salvo no banco de dados');
}

async function downloadYouTubeVideo(url: string, categoryId: string) {
  // Verifica se o diretório de downloads existe
  const downloadsDir = path.join(process.cwd(), 'downloads');
  if (!fs.existsSync(downloadsDir)) {
    fs.mkdirSync(downloadsDir);
  }

  console.log('📁 Diretório de downloads:', downloadsDir);

  // Obtém os metadados do vídeo
  console.log('📝 Obtendo metadados do vídeo...');
  const metadata = await getVideoMetadata(url);
  console.log('✅ Metadados obtidos');

  // Obtém a transcrição do vídeo
  console.log('📝 Obtendo transcrição do vídeo...');
  const transcription = await getVideoTranscription(url);
  console.log(transcription ? '✅ Transcrição obtida' : '⚠️ Nenhuma transcrição disponível');

  // Obtém os formatos disponíveis
  const formats = await getAvailableFormats(url);
  
  // Encontra o ID do áudio em português
  const audioId = await findPortugueseAudioId(formats);
  if (!audioId) {
    throw new Error('Não foi encontrada faixa de áudio em português para este vídeo.');
  }
  
  console.log('🔊 ID do áudio em português:', audioId);
  
  // Encontra o melhor formato de vídeo
  const videoId = await findBestVideoId(formats);
  if (!videoId) {
    throw new Error('Não foi possível encontrar um formato de vídeo adequado.');
  }

  console.log('🎥 ID do vídeo:', videoId);

  // Baixa o vídeo
  const outputTemplate = path.join(downloadsDir, '%(title)s.%(ext)s');
  const command = `yt-dlp "${url}" \
    -f ${videoId}+${audioId} \
    --write-sub \
    --sub-lang pt \
    --embed-subs \
    -o "${outputTemplate}" \
    --print after_move:filepath`;

  console.log('⚡ Executando comando:', command);

  const { stdout, stderr } = await execAsync(command);
  
  console.log('📝 Output do comando:', stdout);
  if (stderr) {
    console.error('❌ Erro do comando:', stderr);
  }
  
  // Obtém o caminho do arquivo baixado
  const filePath = stdout.trim();
  console.log('📄 Caminho do arquivo:', filePath);

  if (!filePath || !fs.existsSync(filePath)) {
    console.error('❌ Arquivo não encontrado no caminho:', filePath);
    console.error('📁 Conteúdo do diretório:', fs.readdirSync(downloadsDir));
    throw new Error('Não foi possível encontrar o arquivo baixado');
  }

  console.log('✅ Arquivo encontrado:', filePath);

  // Faz upload para o Mux
  console.log('☁️ Iniciando upload para o Mux...');
  const { asset_id, playback_id, track_id } = await uploadToMux(filePath);
  console.log('✅ Upload concluído. Asset ID:', asset_id, 'Playback ID:', playback_id);
  
  // Gera a URL do vídeo
  const url_storage = `https://stream.mux.com/${playback_id}`;
  
  // Salva no banco de dados
  console.log('💾 Salvando no banco de dados...');
  await saveToDatabase({
    title: metadata.title,
    description: metadata.description,
    transcription,
    youtube_url: url,
    url_storage,
    category_id: categoryId,
    asset_id,
    playback_id,
    track_id
  });
  console.log('✅ Salvo no banco de dados');
  
  // Remove o arquivo local
  fs.unlinkSync(filePath);
  console.log('🗑️ Arquivo local removido');
  
  return url_storage;
}

export async function POST(request: NextRequest) {
  try {
    const { url, category_id, additional_categories = [] } = await request.json();

    if (!url) {
      return NextResponse.json(
        { error: 'URL é obrigatória' },
        { status: 400 }
      );
    }

    if (!category_id) {
      return NextResponse.json(
        { error: 'Categoria principal é obrigatória' },
        { status: 400 }
      );
    }

    console.log('Iniciando processamento do vídeo:', url);

    // Verificação inicial da URL do YouTube
    try {
      // Verifica se é um URL válido do YouTube
      const youtubePattern = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/;
      if (!youtubePattern.test(url)) {
        return NextResponse.json(
          { error: 'URL inválida. Forneça uma URL válida do YouTube' },
          { status: 400 }
        );
      }

      // Tenta obter formatos para verificar se o vídeo existe e está disponível
      const formats = await getAvailableFormats(url);

      // Verifica se existe áudio em português
      const audioId = await findPortugueseAudioId(formats);
      if (!audioId) {
        return NextResponse.json(
          { error: 'Não foi encontrada faixa de áudio em português para este vídeo' },
          { status: 400 }
        );
      }
    } catch (error) {
      console.error('Erro na verificação inicial do vídeo:', error);
      return NextResponse.json(
        { error: 'Não foi possível verificar o vídeo. Verifique se a URL está correta' },
        { status: 400 }
      );
    }

    // Verifica se o vídeo já existe
    const existingVideo = await mcp_neon_run_sql({
      params: {
        projectId: 'green-frost-95083568',
        databaseName: 'neondb',
        sql: 'SELECT id, processing_status FROM videos WHERE youtube_url = $1',
        values: [url]
      }
    });

    if (existingVideo.rows.length > 0) {
      const videoStatus = existingVideo.rows[0].processing_status;
      
      // Se o vídeo está em processamento, informa ao usuário
      if (videoStatus === 'waiting' || videoStatus === 'downloading' || videoStatus === 'uploading') {
        return NextResponse.json(
          { error: 'Este vídeo já está na fila de processamento' },
          { status: 409 }
        );
      }
      
      // Se já foi processado, retorna erro
      return NextResponse.json(
        { error: 'URL já foi processada', existingId: existingVideo.rows[0].id },
        { status: 400 }
      );
    }

    // Obtém os metadados do vídeo
    const metadata = await getVideoMetadata(url);
    const slug = slugify(metadata.title);

    // Verifica se o diretório de downloads existe
    const downloadsDir = path.join(process.cwd(), 'downloads');
    if (!fs.existsSync(downloadsDir)) {
      fs.mkdirSync(downloadsDir, { recursive: true });
    }

    // Gera um ID único para o vídeo usando gen_random_uuid()
    const videoIdResult = await mcp_neon_run_sql({
      params: {
        projectId: 'green-frost-95083568',
        databaseName: 'neondb',
        sql: 'SELECT gen_random_uuid() as id'
      }
    });
    
    const videoId = videoIdResult.rows[0].id;
    console.log(`🆔 ID gerado para o vídeo: ${videoId}`);

    // Insere o vídeo com status 'waiting'
    console.log(`🔄 Inserindo vídeo no banco com status 'waiting'...`);
    await mcp_neon_run_sql({
      params: {
        projectId: 'green-frost-95083568',
        databaseName: 'neondb',
        sql: `
          INSERT INTO videos (
            id,
            youtube_url, 
            titulo, 
            descricao, 
            thumbnail_url,
            slug,
            processing_status,
            created_at
          ) 
          VALUES ($1, $2, $3, $4, $5, $6, 'waiting', NOW())
        `,
        values: [
          videoId,
          url,
          metadata.title,
          metadata.description,
          metadata.thumbnailUrl,
          slug
        ]
      }
    });
    console.log(`✅ Vídeo inserido com sucesso: ${videoId}`);

    // Insere a categoria principal
    console.log(`🔄 Associando categoria principal: ${category_id}`);
    await mcp_neon_run_sql({
      params: {
        projectId: 'green-frost-95083568',
        databaseName: 'neondb',
        sql: `
          INSERT INTO videos_categorias (video_id, categoria_id)
          VALUES ($1, $2)
        `,
        values: [videoId, category_id]
      }
    });
    console.log(`✅ Categoria principal associada com sucesso`);

    // Insere categorias adicionais
    if (additional_categories.length > 0) {
      console.log(`🔄 Associando ${additional_categories.length} categorias adicionais`);
      const placeholders = additional_categories
        .map((_: unknown, i: number) => `($1, $${i + 2})`)
        .join(', ');

      await mcp_neon_run_sql({
        params: {
          projectId: 'green-frost-95083568',
          databaseName: 'neondb',
          sql: `
            INSERT INTO videos_categorias (video_id, categoria_id)
            VALUES ${placeholders}
          `,
          values: [videoId, ...additional_categories]
        }
      });
      console.log(`✅ Categorias adicionais associadas com sucesso`);
    }

    // Inicia o processamento assíncrono usando um objeto de contexto global
    // Garante que o processamento continue mesmo após a resposta HTTP
    console.log(`🚀 Iniciando processamento assíncrono do vídeo: ${videoId}`);
    
    // Usamos um objeto global para armazenar a promessa e evitar que ela seja coletada pelo GC
    if (!global.processingQueue) {
      global.processingQueue = {};
    }
    
    // Armazena a promessa na fila global e inicia o processamento
    global.processingQueue[videoId] = processVideoAsync(url, videoId, category_id)
      .then(() => {
        console.log(`✅ Processamento do vídeo ${videoId} finalizado com sucesso`);
        delete global.processingQueue[videoId];
      })
      .catch(error => {
        console.error(`❌ Erro no processamento assíncrono do vídeo ${videoId}:`, error);
        delete global.processingQueue[videoId];
      });

    // Verifica quantos vídeos estão em processamento
    const processQueueSize = Object.keys(global.processingQueue).length;
    console.log(`📊 Total de vídeos na fila de processamento: ${processQueueSize}`);

    // Método alternativo - inicia o processamento imediatamente para o primeiro vídeo na fila 
    // se não houver outros sendo processados
    const processingVideosCount = await getProcessingVideosCount();
    if (processingVideosCount === 0) {
      console.log('🔄 Iniciando processamento imediato, pois não há outros vídeos sendo processados');
      
      // Aguarda um curto período antes de iniciar o processamento para garantir que a resposta foi enviada
      setTimeout(async () => {
        try {
          await startNextVideoInQueue();
        } catch (error) {
          console.error('❌ Erro ao iniciar próximo vídeo na fila:', error);
        }
      }, 1000);
    } else {
      console.log(`⏳ Já existem ${processingVideosCount} vídeos em processamento. Este vídeo aguardará na fila.`);
    }

    return NextResponse.json({ 
      success: true, 
      videoId, 
      message: 'Vídeo adicionado à fila de processamento com sucesso'
    });
  } catch (error) {
    console.error('Erro na requisição:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// Função para contar quantos vídeos estão em processamento no momento
async function getProcessingVideosCount(): Promise<number> {
  try {
    const result = await mcp_neon_run_sql({
      params: {
        projectId: process.env.NEON_PROJECT_ID || 'green-frost-95083568',
        databaseName: process.env.NEON_DATABASE_NAME || 'neondb',
        sql: `
          SELECT COUNT(*) as count
          FROM videos 
          WHERE processing_status IN ('downloading', 'uploading')
        `
      }
    });
    
    return parseInt(result.rows[0].count || '0');
  } catch (error) {
    console.error('❌ Erro ao contar vídeos em processamento:', error);
    return 0;
  }
}

// Função para iniciar o processamento do próximo vídeo na fila
async function startNextVideoInQueue(): Promise<void> {
  try {
    // Busca o próximo vídeo com status 'waiting'
    const nextVideoResult = await mcp_neon_run_sql({
      params: {
        projectId: 'green-frost-95083568',
        databaseName: 'neondb',
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
    console.log(`🚀 Iniciando processamento do próximo vídeo na fila: ${video.id}`);
    
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
      .catch(error => {
        console.error(`❌ Erro no processamento assíncrono do vídeo ${video.id}:`, error);
        delete global.processingQueue[video.id];
        
        // Mesmo em caso de erro, continua para o próximo vídeo
        startNextVideoInQueue();
      });
  } catch (error) {
    console.error('❌ Erro ao iniciar próximo vídeo na fila:', error);
  }
}

// Função assíncrona para processar o vídeo sem bloquear a resposta
async function processVideoAsync(url: string, videoId: string, categoryId: string) {
  try {
    console.log(`🔄 Iniciando processamento do vídeo ${videoId} com URL: ${url}`);
    
    // Atualiza o status para 'downloading'
    await updateVideoStatus(videoId, 'downloading');
    console.log(`✅ Status do vídeo ${videoId} atualizado para processamento`);
    
    // Verifica se já existe outro vídeo em processamento
    const processingVideos = await mcp_neon_run_sql({
      params: {
        projectId: 'green-frost-95083568',
        databaseName: 'neondb',
        sql: `
          SELECT COUNT(*) as count
          FROM videos 
          WHERE processing_status IN ('downloading', 'uploading') 
          AND id != $1
          AND created_at > (NOW() - INTERVAL '5 minutes')
        `,
        values: [videoId]
      }
    });
    
    const processingCount = parseInt(processingVideos.rows[0].count);
    
    // Se já existe outro processamento, espera um pouco para evitar sobrecarga
    if (processingCount > 0) {
      console.log(`⏳ Aguardando ${processingCount} vídeos em processamento concluírem...`);
      await new Promise(resolve => setTimeout(resolve, 30000)); // Espera 30 segundos
    }

    // Verifica se o diretório de downloads existe
    const downloadsDir = path.join(process.cwd(), 'downloads');
    if (!fs.existsSync(downloadsDir)) {
      fs.mkdirSync(downloadsDir, { recursive: true });
    }

    // Obtém os metadados do vídeo
    console.log('📝 Obtendo metadados do vídeo...');
    const metadata = await getVideoMetadata(url);
    console.log('✅ Metadados obtidos');

    // Obtém a transcrição do vídeo
    console.log('📝 Obtendo transcrição do vídeo...');
    const transcription = await getVideoTranscription(url);
    console.log(transcription ? '✅ Transcrição obtida' : '⚠️ Nenhuma transcrição disponível');

    // Obtém os formatos disponíveis
    const formats = await getAvailableFormats(url);
    
    // Encontra o ID do áudio em português
    const audioId = await findPortugueseAudioId(formats);
    if (!audioId) {
      throw new Error('Não foi encontrada faixa de áudio em português para este vídeo.');
    }
    
    console.log('🔊 ID do áudio em português:', audioId);
    
    // Encontra o melhor formato de vídeo
    const videoId2 = await findBestVideoId(formats);
    if (!videoId2) {
      throw new Error('Não foi possível encontrar um formato de vídeo adequado.');
    }

    // Baixa o vídeo
    const outputTemplate = path.join(downloadsDir, '%(title)s.%(ext)s');
    const command = `yt-dlp "${url}" \
      -f ${videoId2}+${audioId} \
      --write-sub \
      --sub-lang pt \
      --embed-subs \
      -o "${outputTemplate}" \
      --print after_move:filepath`;

    console.log('⚡ Executando download do vídeo...');

    const { stdout, stderr } = await execAsync(command);
    
    // Obtém o caminho do arquivo baixado
    const filePath = stdout.trim();
    console.log('📄 Arquivo baixado:', filePath);

    if (!filePath || !fs.existsSync(filePath)) {
      console.error('❌ Arquivo não encontrado no caminho:', filePath);
      throw new Error('Não foi possível encontrar o arquivo baixado');
    }

    // Atualiza status para uploading
    await updateVideoStatus(videoId, 'uploading');

    // Faz upload para o Mux
    console.log('☁️ Iniciando upload para o Mux...');
    const { asset_id, playback_id, track_id } = await uploadToMux(filePath);
    console.log('✅ Upload concluído. Asset ID:', asset_id, 'Playback ID:', playback_id);
    
    // Gera a URL do vídeo
    const url_storage = `https://stream.mux.com/${playback_id}`;
    
    // Atualiza o vídeo com as informações processadas
    const updateResult = await mcp_neon_run_sql({
      params: {
        projectId: 'green-frost-95083568',
        databaseName: 'neondb',
        sql: `
          UPDATE videos 
          SET 
            processing_status = 'completed', 
            url_video = $1,
            asset_id = $2,
            playback_id = $3,
            track_id = $4
          WHERE id = $5
          RETURNING processing_status
        `,
        values: [url_storage, asset_id, playback_id, track_id || null, videoId]
      }
    });

    console.log(`✅ Vídeo atualizado para status: ${updateResult.rows[0]?.processing_status || 'desconhecido'}`);

    // Remove o arquivo local de forma segura, verificando se ele ainda existe
    try {
      if (filePath && fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log('🗑️ Arquivo local removido');
      } else {
        console.log('⚠️ Arquivo já foi removido ou não existe:', filePath);
      }
    } catch (err) {
      console.error('⚠️ Não foi possível remover o arquivo local:', err);
    }
    
    console.log('✅ Processamento finalizado com sucesso para o vídeo:', videoId);
  } catch (error) {
    console.error('❌ Erro ao processar vídeo:', error);

    // Em caso de erro, atualiza o status para 'error'
    try {
      // Verificamos os valores permitidos para processing_status
      const checkConstraintResult = await mcp_neon_run_sql({
        params: {
          projectId: 'green-frost-95083568',
          databaseName: 'neondb',
          sql: `
            SELECT pg_get_constraintdef(c.oid) as constraint_def
            FROM pg_constraint c
            JOIN pg_class t ON c.conrelid = t.oid
            JOIN pg_namespace n ON t.relnamespace = n.oid
            WHERE t.relname = 'videos'
            AND n.nspname = 'public'
            AND c.conname = 'videos_processing_status_check'
          `
        }
      });
      
      // Exibe a definição da restrição para debugging
      const constraintDef = checkConstraintResult.rows[0]?.constraint_def;
      console.log(`ℹ️ Definição da restrição: ${constraintDef || 'não encontrada'}`);
      
      // Atualiza para um status de erro permitido
      await mcp_neon_run_sql({
        params: {
          projectId: 'green-frost-95083568',
          databaseName: 'neondb',
          sql: `
            UPDATE videos 
            SET error = $1
            WHERE id = $2
          `,
          values: [error instanceof Error ? error.message : 'Erro desconhecido', videoId]
        }
      });
      
      console.log(`✅ Erro registrado para o vídeo ${videoId}`);
    } catch (updateError) {
      console.error('❌ Erro ao atualizar status de erro:', updateError);
    }
    
    // Propaga o erro para ser tratado pelo chamador
    throw error;
  }
}

// Função auxiliar para atualizar o status do vídeo
async function updateVideoStatus(videoId: string, status: string, errorMessage?: string) {
  // Mapeia estados personalizados para os estados permitidos no banco
  let dbStatus = status;
  
  // Verifica quais valores são permitidos pelo CHECK constraint
  if (status === 'downloading' || status === 'uploading') {
    dbStatus = 'waiting'; // Use 'waiting' como valor de fallback se os outros não forem permitidos
  }
  
  console.log(`🔄 Atualizando status do vídeo ${videoId} para: ${status} (DB: ${dbStatus})`);
  
  const sqlParams: any = {
    projectId: 'green-frost-95083568',
    databaseName: 'neondb',
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