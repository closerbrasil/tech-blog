import { exec } from 'child_process';
import { promisify } from 'util';
import { Storage } from '@google-cloud/storage';
import { Pool } from 'pg';
import { config } from './config';
import path from 'path';
import fs from 'fs';

const execAsync = promisify(exec);

// Inicializa o cliente do Google Cloud Storage
const storage = new Storage({
  projectId: config.storage.projectId,
  keyFilename: config.storage.keyFilePath
});

const bucket = storage.bucket(config.storage.bucketName);

// Verifica se o bucket existe e está acessível
async function checkBucketAccess() {
  try {
    const [exists] = await bucket.exists();
    if (!exists) {
      throw new Error(`Bucket ${config.storage.bucketName} não encontrado`);
    }
    console.log(`✅ Bucket ${config.storage.bucketName} encontrado e acessível`);
  } catch (error) {
    console.error('❌ Erro ao acessar o bucket:', error);
    throw error;
  }
}

// Inicializa o cliente do PostgreSQL com a string de conexão
const pool = new Pool({
  connectionString: config.database,
  ssl: {
    rejectUnauthorized: false
  }
});

async function getAvailableFormats(url: string): Promise<string> {
  const command = `yt-dlp -F "${url}"`;
  const { stdout } = await execAsync(command);
  return stdout;
}

async function findPortugueseAudioId(formats: string): Promise<string | null> {
  // Procura por linhas que contenham [pt] ou [pt-BR] na descrição do áudio
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
  // Procura pelo melhor formato de vídeo (sem áudio) até 1080p
  const lines = formats.split('\n');
  let bestVideoId = '';
  
  for (const line of lines) {
    if (line.includes('1080p') && line.includes('video only')) {
      const id = line.split(' ')[0];
      bestVideoId = id;
      break;
    }
  }
  
  // Se não encontrar 1080p, pega o primeiro formato de vídeo disponível
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

async function uploadToStorage(filePath: string): Promise<string> {
  console.log(`📤 Iniciando upload do arquivo ${filePath} para o bucket ${config.storage.bucketName}...`);
  const fileName = path.basename(filePath);
  const destination = `videos/${fileName}`;
  
  try {
    await bucket.upload(filePath, {
      destination,
      metadata: {
        cacheControl: 'public, max-age=31536000'
      }
    });
    
    console.log(`✅ Upload concluído para ${destination}`);
    
    // Retorna a URL pública do arquivo
    const publicUrl = `https://storage.googleapis.com/${config.storage.bucketName}/${destination}`;
    console.log(`🔗 URL pública gerada: ${publicUrl}`);
    return publicUrl;
  } catch (error) {
    console.error('❌ Erro durante o upload:', error);
    throw error;
  }
}

async function saveToDatabase(data: {
  title: string;
  youtube_url: string;
  url_storage: string;
  category_id: string;
}): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const query = `
      INSERT INTO youtube (title, youtube_url, url_storage, category_id)
      VALUES ($1, $2, $3, $4)
      RETURNING id
    `;
    
    const result = await client.query(query, [
      data.title,
      data.youtube_url,
      data.url_storage,
      data.category_id
    ]);

    await client.query('COMMIT');
    console.log('Registro salvo com ID:', result.rows[0].id);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function downloadYouTubeVideo(url: string, categoryId: string) {
  try {
    console.log('Buscando formatos disponíveis...');
    const formats = await getAvailableFormats(url);
    
    console.log('Procurando faixa de áudio em português...');
    const audioId = await findPortugueseAudioId(formats);
    
    if (!audioId) {
      console.error('Não foi encontrada faixa de áudio em português para este vídeo.');
      return;
    }
    
    console.log('Procurando melhor formato de vídeo...');
    const videoId = await findBestVideoId(formats);
    
    if (!videoId) {
      console.error('Não foi possível encontrar um formato de vídeo adequado.');
      return;
    }

    console.log(`Baixando vídeo com formato ${videoId} e áudio ${audioId}...`);
    
    // Cria o diretório de downloads se não existir
    if (!fs.existsSync('downloads')) {
      fs.mkdirSync('downloads');
    }
    
    // Comando para baixar o vídeo com o formato específico de vídeo e áudio
    const outputTemplate = 'downloads/%(title)s.%(ext)s';
    const command = `yt-dlp "${url}" \
      -f ${videoId}+${audioId} \
      --write-sub \
      --sub-lang pt \
      --embed-subs \
      -o "${outputTemplate}" \
      --print filename`;

    console.log('Iniciando download...');
    console.log('Isso pode levar alguns minutos dependendo do tamanho do vídeo...');
    console.log('Comando:', command);
    
    const { stdout, stderr } = await execAsync(command);
    
    console.log('Output do comando:');
    console.log(stdout);
    
    if (stderr) {
      console.error('Erros do comando:');
      console.error(stderr);
    }
    
    // O yt-dlp com --print filename imprime o nome do arquivo na última linha
    const filePath = stdout.trim().split('\n').pop();
    
    if (!filePath) {
      throw new Error('Não foi possível encontrar o arquivo baixado');
    }
    
    if (!fs.existsSync(filePath)) {
      throw new Error(`Arquivo não encontrado no caminho: ${filePath}`);
    }
    
    console.log('Arquivo baixado:', filePath);
    console.log('Upload para o Google Cloud Storage...');
    const publicUrl = await uploadToStorage(filePath);
    
    console.log('Salvando informações no banco de dados...');
    const title = path.basename(filePath, path.extname(filePath));
    await saveToDatabase({
      title,
      youtube_url: url,
      url_storage: publicUrl,
      category_id: categoryId
    });
    
    // Remove o arquivo local após o upload
    fs.unlinkSync(filePath);
    
    console.log('Processo concluído com sucesso!');
    console.log('URL pública:', publicUrl);
  } catch (error) {
    console.error('Erro ao processar o vídeo:', error);
    if (error instanceof Error) {
      console.error('Stack trace:', error.stack);
    }
    throw error;
  }
}

// Exemplo de uso
const videoUrl = process.argv[2];
const categoryId = process.argv[3];

if (!videoUrl || !categoryId) {
  console.error('Por favor, forneça a URL do vídeo e o ID da categoria como argumentos.');
  console.log('Exemplo: bun run index.ts "https://www.youtube.com/watch?v=VIDEO_ID" "CATEGORY_UUID"');
  console.log('IMPORTANTE: A URL deve estar entre aspas!');
  process.exit(1);
}

// Verifica o acesso ao bucket antes de iniciar o download
checkBucketAccess()
  .then(() => downloadYouTubeVideo(videoUrl, categoryId))
  .catch(error => {
    console.error('Erro fatal:', error);
    process.exit(1);
  });