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

async function getVideoMetadata(url: string): Promise<{ title: string; description: string }> {
  const command = `yt-dlp "${url}" --get-title --get-description`;
  const { stdout } = await execAsync(command);
  const [title, ...descriptionLines] = stdout.trim().split('\n');
  return {
    title: title || '',
    description: descriptionLines.join('\n') || ''
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
      projectId: process.env.NEON_PROJECT_ID!,
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
      projectId: process.env.NEON_PROJECT_ID!,
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
        projectId: process.env.NEON_PROJECT_ID!,
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
    const { url, category_id, additional_categories } = await request.json();

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

    console.log('🎥 Iniciando download do vídeo:', url);

    // Verifica se o vídeo já existe
    const existingVideo = await mcp_neon_run_sql({
      params: {
        projectId: process.env.NEON_PROJECT_ID!,
        databaseName: process.env.NEON_DATABASE_NAME || 'neondb',
        sql: `
          SELECT id, url_video 
          FROM videos 
          WHERE youtube_url = $1
        `,
        values: [url]
      }
    });

    if (existingVideo?.rows?.length > 0) {
      return NextResponse.json(
        { 
          error: 'Este vídeo já foi baixado anteriormente',
          existingUrl: existingVideo.rows[0].url_video
        },
        { status: 409 }
      );
    }

    const publicUrl = await downloadYouTubeVideo(url, category_id);

    return NextResponse.json({ success: true, url: publicUrl });
  } catch (error) {
    console.error('❌ Erro ao processar vídeo:', error);
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Erro ao processar vídeo'
      },
      { status: 500 }
    );
  }
} 