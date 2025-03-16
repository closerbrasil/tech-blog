import { ReactNode } from 'react'

interface AdminLayoutProps {
  children: ReactNode
  title?: string
}

export default function AdminLayout({ children, title }: AdminLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        {title && (
          <h1 className="text-3xl font-bold mb-8">{title}</h1>
        )}
        {children}
      </div>
    </div>
  )
} 