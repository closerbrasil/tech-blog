import Image from 'next/image'
import Link from 'next/link'

interface VideoCardProps {
  titulo: string
  slug: string
  thumbnail_url: string
  meta_descricao?: string
  autor?: {
    nome: string
    avatar_url: string
  }
  visualizacoes: number
  className?: string
}

export function VideoCard({
  titulo,
  slug,
  thumbnail_url,
  meta_descricao,
  autor,
  visualizacoes,
  className
}: VideoCardProps) {
  return (
    <Link href={`/videos/${slug}`}>
      <div className={`w-full p-4 rounded-xl border border-[rgba(255,255,255,0.10)] dark:bg-[rgba(40,40,40,0.70)] bg-gray-100 shadow-[2px_4px_16px_0px_rgba(248,248,248,0.06)_inset] group hover:shadow-lg transition-shadow ${className}`}>
        <div className="aspect-video relative mb-4 rounded-xl overflow-hidden">
          <Image 
            src={thumbnail_url}
            alt={titulo}
            fill
            className="object-cover transition-transform group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          
          {/* Ícone de Play */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-14 h-14 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center group-hover:bg-white/40 transition-all duration-300 shadow-lg">
              <svg 
                className="w-7 h-7 text-white drop-shadow-lg group-hover:scale-110 transition-transform" 
                fill="currentColor" 
                viewBox="0 0 24 24"
                style={{ transform: 'translateX(2px)' }}
              >
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
          
          <div className="absolute bottom-4 left-4 right-4">
            <h3 className="text-lg font-semibold text-white truncate">{titulo}</h3>
          </div>
        </div>
        
        {meta_descricao && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">{meta_descricao}</p>
        )}
        
        <div className="flex items-center justify-between">
          {autor && (
            <div className="flex items-center space-x-3">
              <Image
                src={autor.avatar_url}
                alt={autor.nome}
                width={32}
                height={32}
                className="rounded-full"
              />
              <span className="text-sm text-gray-600 dark:text-gray-400">{autor.nome}</span>
            </div>
          )}
          <span className="text-sm text-gray-600 dark:text-gray-400">{visualizacoes} views</span>
        </div>
      </div>
    </Link>
  )
} 