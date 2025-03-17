import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';
import { mcp_neon_run_sql } from '@/lib/mcp';
import Mux from '@mux/mux-node';

const execAsync = promisify(exec);

// Inicializa o cliente do Mux
const mux = new Mux({
  tokenId: process.env.MUX_TOKEN_ID || '',
  tokenSecret: process.env.MUX_TOKEN_SECRET || ''
});

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

async function uploadToMux(filePath: string): Promise<{ asset_id: string; playback_id: string }> {
  // Cria um novo upload direto
  const upload = await mux.video.uploads.create({
    new_asset_settings: {
      playback_policy: ['public'],
      video_quality: 'plus',
      max_resolution_tier: '1080p'
    },
    cors_origin: '*'
  });

  if (!upload || !upload.url) {
    throw new Error('Falha ao criar upload no Mux: URL de upload não recebida');
  }

  // Faz o upload do arquivo
  const fileBuffer = fs.readFileSync(filePath);
  const uploadResponse = await fetch(upload.url, {
    method: 'PUT',
    body: fileBuffer,
    headers: {
      'Content-Type': 'video/mp4'
    }
  });

  if (!uploadResponse.ok) {
    throw new Error(`Falha ao fazer upload do arquivo para o Mux: ${uploadResponse.status} ${uploadResponse.statusText}`);
  }

  // Aguarda o upload ser processado e o asset ser criado
  let asset;
  let attempts = 0;
  const maxAttempts = 30; // 5 minutos (10 segundos * 30 tentativas)

  while (attempts < maxAttempts) {
    const uploadStatus = await mux.video.uploads.retrieve(upload.id);
    
    if (uploadStatus.asset_id) {
      asset = await mux.video.assets.retrieve(uploadStatus.asset_id);
      break;
    }

    await new Promise(resolve => setTimeout(resolve, 10000)); // Espera 10 segundos
    attempts++;
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

  return {
    asset_id: asset.id,
    playback_id: playbackId
  };
}

async function saveToDatabase(data: {
  title: string;
  youtube_url: string;
  url_storage: string;
  category_id: string;
  asset_id: string;
  playback_id: string;
}): Promise<void> {
  // Validação dos dados antes de salvar
  if (!data.title || !data.youtube_url || !data.url_storage || !data.category_id || !data.asset_id || !data.playback_id) {
    throw new Error('Dados incompletos para salvar no banco de dados');
  }

  const now = new Date().toISOString();
  const slug = data.title.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  const result = await mcp_neon_run_sql({
    params: {
      projectId: process.env.NEON_PROJECT_ID!,
      databaseName: process.env.NEON_DATABASE_NAME || 'neondb',
      sql: `
        INSERT INTO videos (
          id,
          titulo,
          youtube_url,
          url_video,
          categoria_id,
          asset_id,
          playback_id,
          origem,
          status,
          visibilidade,
          slug,
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
          'youtube',
          'publicado',
          'publico',
          $7,
          $8,
          $8
        )
        RETURNING id
      `,
      values: [
        data.title,
        data.youtube_url,
        data.url_storage,
        data.category_id,
        data.asset_id,
        data.playback_id,
        slug,
        now
      ]
    }
  });

  // Verifica se o registro foi criado com sucesso
  if (!result) {
    throw new Error('Falha ao salvar o vídeo no banco de dados');
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
  const { asset_id, playback_id } = await uploadToMux(filePath);
  console.log('✅ Upload concluído. Asset ID:', asset_id, 'Playback ID:', playback_id);
  
  // Gera a URL do vídeo
  const url_storage = `https://stream.mux.com/${playback_id}`;
  
  // Salva no banco de dados
  const title = path.basename(filePath, path.extname(filePath));
  console.log('💾 Salvando no banco de dados...');
  await saveToDatabase({
    title,
    youtube_url: url,
    url_storage,
    category_id: categoryId,
    asset_id,
    playback_id
  });
  console.log('✅ Salvo no banco de dados');
  
  // Remove o arquivo local
  fs.unlinkSync(filePath);
  console.log('🗑️ Arquivo local removido');
  
  return url_storage;
}

export async function POST(request: NextRequest) {
  try {
    const { url, categoryId } = await request.json();

    if (!url || !categoryId) {
      return NextResponse.json(
        { error: 'URL do vídeo e ID da categoria são obrigatórios' },
        { status: 400 }
      );
    }

    const publicUrl = await downloadYouTubeVideo(url, categoryId);

    return NextResponse.json({ success: true, url: publicUrl });
  } catch (error) {
    console.error('Erro ao processar o vídeo:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao processar o vídeo' },
      { status: 500 }
    );
  }
} 