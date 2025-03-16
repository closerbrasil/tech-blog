import { Metadata } from 'next'

type SeoType = "website" | "article" | "profile" | "video.other"

interface SEOHeadProps {
  title: string
  description: string
  type?: SeoType
  image?: string
  url?: string
  publishedTime?: string
  modifiedTime?: string
  author?: {
    name: string
    url: string
  }
  keywords?: string[]
  canonicalUrl?: string
  jsonLd?: Record<string, any> | Record<string, any>[]
}

// Constantes para valores padrão
const SITE_TITLE = "Closer Brasil"
const DEFAULT_DESCRIPTION = "Notícias e análises sobre tecnologia, cultura e negócios no Brasil"
const DEFAULT_IMAGE = "https://closer-brasil.com/og-image.jpg"
const DEFAULT_TYPE = "website"

// Função auxiliar para gerar metadata
export function generateMetadata({
  title,
  description,
  type = DEFAULT_TYPE,
  image = DEFAULT_IMAGE,
  url,
  publishedTime,
  modifiedTime,
  author,
  keywords = [],
  canonicalUrl,
  jsonLd,
}: SEOHeadProps): Metadata {
  const fullTitle = `${title} | ${SITE_TITLE}`
  const safeDescription = description || DEFAULT_DESCRIPTION
  const safeKeywords = Array.isArray(keywords) ? keywords.join(", ") : ""

  const metadata: Metadata = {
    title: fullTitle,
    description: safeDescription,
    keywords: safeKeywords,
    authors: author ? [{ name: author.name, url: author.url }] : undefined,
    openGraph: {
      title: fullTitle,
      description: safeDescription,
      siteName: SITE_TITLE,
      type,
      locale: 'pt_BR',
      url: url || undefined,
      images: [{
        url: image,
        alt: title,
      }],
      ...(type === 'article' && {
        article: {
          publishedTime,
          modifiedTime,
          authors: author ? [author.name] : undefined,
        },
      }),
    },
    twitter: {
      card: 'summary_large_image',
      site: '@closerbrasil',
      title: fullTitle,
      description: safeDescription,
      images: [image],
    },
    robots: {
      index: true,
      follow: true,
    },
    alternates: {
      canonical: canonicalUrl,
    },
    themeColor: '#ffffff',
    other: {
      'msapplication-TileColor': '#ffffff',
    },
  }

  // Adiciona JSON-LD se fornecido
  if (jsonLd) {
    const jsonLdScripts = Array.isArray(jsonLd) 
      ? jsonLd.map(item => JSON.stringify(item))
      : [JSON.stringify(jsonLd)]

    metadata.other = {
      'msapplication-TileColor': '#ffffff',
      'script:ld+json': jsonLdScripts
    }
  }

  return metadata
}

// Componente para uso em páginas que não podem usar generateMetadata
export default function SEOHead(props: SEOHeadProps) {
  // Este componente é mantido para compatibilidade com páginas que não podem usar generateMetadata
  return null // Next.js 14 gerencia os metadados automaticamente através do generateMetadata
}

// Exemplo de uso em uma página:
/*
import { Metadata } from 'next'
import { generateMetadata } from '@/components/seo/SEOhead'

export const metadata: Metadata = generateMetadata({
  title: 'Minha Página',
  description: 'Descrição da minha página',
  type: 'article',
  publishedTime: '2024-03-15T12:00:00Z',
  author: {
    name: 'Autor',
    url: 'https://closer-brasil.com/autor'
  }
})
*/