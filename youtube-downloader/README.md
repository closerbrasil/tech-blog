# YouTube Downloader com Áudio em Português

Este é um script simples para baixar vídeos do YouTube com faixa de áudio em português usando o yt-dlp.

## Pré-requisitos

- [Bun](https://bun.sh) instalado
- [yt-dlp](https://github.com/yt-dlp/yt-dlp) instalado (`brew install yt-dlp` no macOS)

## Instalação

1. Clone este repositório
2. Instale as dependências:
```bash
bun install
```

## Uso

Para baixar um vídeo, execute:

```bash
bun run index.ts "URL_DO_VIDEO"
```

Por exemplo:
```bash
bun run index.ts "https://www.youtube.com/watch?v=VIDEO_ID"
```

⚠️ **IMPORTANTE**: 
- A URL deve estar entre aspas para evitar erros com caracteres especiais!
- O script só baixará vídeos que tenham uma faixa de áudio em português disponível

O script irá:
1. Verificar todos os formatos disponíveis para o vídeo
2. Procurar especificamente por uma faixa de áudio em português
3. Se encontrar:
   - Selecionar o melhor formato de vídeo (até 1080p)
   - Baixar e combinar com a faixa de áudio em português
   - Baixar e incorporar legendas em português (se disponíveis)
4. Se não encontrar áudio em português:
   - Informará que não há faixa de áudio em português disponível
   - Não realizará o download

## Configurações

O script está configurado para:
- Detectar automaticamente faixas de áudio em português (`[pt]` ou `[pt-BR]`)
- Selecionar o melhor formato de vídeo até 1080p
- Baixar e incorporar legendas em português (`--write-sub --sub-lang pt --embed-subs`)
- Salvar os arquivos na pasta `downloads`

## Observações

- O download pode levar alguns minutos dependendo do tamanho do vídeo
- O script APENAS baixará vídeos que tenham uma faixa de áudio em português disponível
- Os arquivos são salvos na pasta `downloads` com o título original do vídeo
- Se o vídeo não tiver uma faixa de áudio em português, o script informará e não realizará o download
