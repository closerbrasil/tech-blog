import Link from 'next/link'

export default function VideoNotFound() {
  return (
    <main className="container mx-auto px-4 py-16 text-center">
      <h1 className="text-4xl font-bold mb-4">Vídeo não encontrado</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-8">
        O vídeo que você está procurando não existe ou não está disponível.
      </p>
      <Link 
        href="/videos" 
        className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
      >
        Voltar para a lista de vídeos
      </Link>
    </main>
  )
} 