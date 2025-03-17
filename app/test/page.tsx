import Image from 'next/image'
import { db } from '@/lib/db'

export default async function TestPage() {
  const videos = await db.video.findMany({
    where: {
      status: 'PUBLIC'
    },
    include: {
      autores: true,
      categorias: true,
    }
  })

  const video = videos[0] // Usando o primeiro vídeo como exemplo

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8">Escolha um Estilo de Card</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {/* Estilo 1: Card Moderno com Gradiente */}
        <div>
          <h2 className="text-lg font-semibold mb-4">1. Card Moderno com Gradiente</h2>
          <div className="max-w-sm w-full mx-auto p-4 rounded-xl border border-[rgba(255,255,255,0.10)] dark:bg-[rgba(40,40,40,0.70)] bg-gray-100 shadow-[2px_4px_16px_0px_rgba(248,248,248,0.06)_inset] group">
            <div className="aspect-video relative mb-4 rounded-xl overflow-hidden">
              <Image 
                src={video.thumbnail_url}
                alt={video.titulo}
                fill
                className="object-cover transition-transform group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4">
                <h3 className="text-lg font-semibold text-white truncate">{video.titulo}</h3>
              </div>
            </div>
            
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">{video.meta_descricao}</p>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Image
                  src={video.autores.avatar_url}
                  alt={video.autores.nome}
                  width={32}
                  height={32}
                  className="rounded-full"
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">{video.autores.nome}</span>
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-400">{video.visualizacoes} views</span>
            </div>
          </div>
        </div>

        {/* Estilo 2: Card com Padrão de Linhas */}
        <div>
          <h2 className="text-lg font-semibold mb-4">2. Card com Padrão de Linhas</h2>
          <div className="relative w-full rounded-lg border border-border overflow-hidden bg-white dark:bg-zinc-900">
            <div className="bg-[linear-gradient(45deg,transparent_25%,rgba(68,68,68,.2)_50%,transparent_75%,transparent_100%)] bg-[length:20px_20px] p-4">
              <div className="aspect-video relative mb-4">
                <Image 
                  src={video.thumbnail_url}
                  alt={video.titulo}
                  fill
                  className="object-cover rounded-lg"
                />
              </div>
              
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white line-clamp-2">
                  {video.titulo}
                </h3>
                
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Image
                      src={video.autores.avatar_url}
                      alt={video.autores.nome}
                      width={24}
                      height={24}
                      className="rounded-full"
                    />
                    <span className="text-gray-600 dark:text-gray-300">{video.autores.nome}</span>
                  </div>
                  <span className="text-gray-500">{new Date(video.publicado_em).toLocaleDateString('pt-BR')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Estilo 3: Card Neubrutalism */}
        <div>
          <h2 className="text-lg font-semibold mb-4">3. Card Neubrutalism</h2>
          <div className="border-2 border-zinc-900 dark:border-white relative shadow-[4px_4px_0px_0px_rgba(0,0,0)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,0.7)] bg-white dark:bg-zinc-900 rounded-lg overflow-hidden">
            <div className="aspect-video relative">
              <Image 
                src={video.thumbnail_url}
                alt={video.titulo}
                fill
                className="object-cover"
              />
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                <div className="flex items-center gap-3">
                  <Image
                    src={video.autores.avatar_url}
                    alt={video.autores.nome}
                    width={40}
                    height={40}
                    className="rounded-full border-2 border-white"
                  />
                  <div>
                    <h3 className="text-white font-bold line-clamp-1">{video.titulo}</h3>
                    <p className="text-white/80 text-sm">{video.autores.nome}</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-4 border-t-2 border-zinc-900 dark:border-white">
              <div className="flex items-center justify-between text-sm font-medium">
                <span>{video.visualizacoes} visualizações</span>
                <span>{video.curtidas} curtidas</span>
              </div>
            </div>
          </div>
        </div>

        {/* Estilo 4: Card Minimalista */}
        <div>
          <h2 className="text-lg font-semibold mb-4">4. Card Minimalista</h2>
          <div className="bg-white dark:bg-zinc-900 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
            <div className="aspect-video relative">
              <Image 
                src={video.thumbnail_url}
                alt={video.titulo}
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-black/20 opacity-0 hover:opacity-100 transition-opacity" />
            </div>
            
            <div className="p-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2 line-clamp-2">
                {video.titulo}
              </h3>
              
              <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                <span>{video.visualizacoes} visualizações</span>
                <span className="mx-2">•</span>
                <span>{new Date(video.publicado_em).toLocaleDateString('pt-BR')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Estilo 5: Card com Destaque na Categoria */}
        <div>
          <h2 className="text-lg font-semibold mb-4">5. Card com Destaque na Categoria</h2>
          <div className="bg-white dark:bg-zinc-900 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800">
            <div className="aspect-video relative">
              <Image 
                src={video.thumbnail_url}
                alt={video.titulo}
                fill
                className="object-cover"
              />
              <div 
                className="absolute top-4 left-4 px-3 py-1 rounded-full text-white text-sm font-medium"
                style={{ backgroundColor: video.categorias.cor }}
              >
                {video.categorias.nome}
              </div>
            </div>
            
            <div className="p-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 line-clamp-2">
                {video.titulo}
              </h3>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Image
                    src={video.autores.avatar_url}
                    alt={video.autores.nome}
                    width={32}
                    height={32}
                    className="rounded-full"
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{video.autores.nome}</p>
                    <p className="text-xs text-gray-500">{video.autores.cargo}</p>
                  </div>
                </div>
                <div className="text-sm text-gray-500">
                  {video.duracao} min
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
