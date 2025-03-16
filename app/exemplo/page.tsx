import { Metadata } from 'next'
import { generateMetadata } from '@/components/seo/SEOhead'

export const metadata: Metadata = generateMetadata({
  title: 'Título da Página',
  description: 'Descrição detalhada da página',
  type: 'article',
  image: '/caminho/para/imagem.jpg',
  publishedTime: new Date().toISOString(),
  author: {
    name: 'Nome do Autor',
    url: 'https://closer-brasil.com/autores/nome'
  },
  keywords: ['tecnologia', 'notícias', 'brasil'],
})

export default function Page() {
  return (
    // ... conteúdo da página
  )
} 