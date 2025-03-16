'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  LayoutDashboard, 
  FileText, 
  Video,
  Users,
  Tag,
  MessageSquare,
  Settings,
  Bot,
  Key,
  LogOut
} from 'lucide-react'

const menuItems = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { 
    href: '#',
    label: 'Conteúdo',
    icon: FileText,
    submenu: [
      { href: '/admin/manage-posts', label: 'Gerenciar Artigos' },
      { href: '/admin/create-post', label: 'Criar Artigo' },
      { href: '/admin/videos', label: 'Vídeos' },
      { href: '/admin/create-video', label: 'Criar Vídeo' },
    ]
  },
  { 
    href: '#',
    label: 'Taxonomia',
    icon: Tag,
    submenu: [
      { href: '/admin/categories', label: 'Categorias' },
      { href: '/admin/tags', label: 'Tags' },
    ]
  },
  { href: '/admin/author', label: 'Autores', icon: Users },
  { href: '/admin/comments', label: 'Comentários', icon: MessageSquare },
  { href: '/admin/automacoes', label: 'Automações', icon: Bot },
  { href: '/admin/keywords', label: 'Keywords', icon: Key },
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  return (
    <div className="flex h-full bg-background">
      {/* Sidebar Fixa */}
      <aside className="w-64 flex-shrink-0 border-r bg-card">
        <div className="h-14 flex items-center px-6 border-b bg-card">
          <Link href="/admin/dashboard" className="text-xl font-bold text-primary hover:text-primary/90">
            Admin
          </Link>
        </div>
        
        <ScrollArea className="h-[calc(100vh-3.5rem)] py-2">
          <nav className="px-4 space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href || 
                (item.submenu?.some(sub => pathname === sub.href))
              
              if (item.submenu) {
                return (
                  <div key={item.label} className="space-y-1">
                    <div className={cn(
                      "flex items-center space-x-3 px-3 py-2 text-sm font-medium rounded-lg",
                      isActive 
                        ? "bg-primary/10 text-primary" 
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    )}>
                      <Icon className="h-5 w-5" />
                      <span>{item.label}</span>
                    </div>
                    <div className="pl-10 space-y-1">
                      {item.submenu.map(subItem => (
                        <Link
                          key={subItem.href}
                          href={subItem.href}
                          className={cn(
                            "block py-2 px-3 rounded-lg text-sm font-medium transition-colors",
                            pathname === subItem.href
                              ? "bg-primary/10 text-primary dark:bg-primary/20"
                              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                          )}
                        >
                          {subItem.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                )
              }

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    isActive 
                      ? "bg-primary/10 text-primary dark:bg-primary/20" 
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </Link>
              )
            })}
            
            <button 
              className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 hover:text-destructive-foreground transition-colors"
              onClick={() => {
                // Implementar logout
              }}
            >
              <LogOut className="h-5 w-5" />
              <span>Sair</span>
            </button>
          </nav>
        </ScrollArea>
      </aside>

      {/* Área de Conteúdo Principal */}
      <main className="flex-1 flex flex-col min-h-0 bg-background">
        <ScrollArea className="flex-1 p-6">
          {children}
        </ScrollArea>
      </main>
    </div>
  )
} 