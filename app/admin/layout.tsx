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
  LogOut,
  Menu,
  X
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'

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
      { href: '/admin/youtube-downloader', label: 'YouTube Downloader' },
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)

  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [pathname])

  return (
    <div className="flex min-h-screen w-full bg-background overflow-hidden">
      {/* Sidebar para Desktop */}
      <aside className={cn(
        "hidden md:flex flex-shrink-0 border-r bg-card transition-all duration-300",
        isSidebarOpen ? "w-64" : "w-16"
      )}>
        <div className="w-full flex flex-col">
          <div className="h-14 flex items-center px-6 border-b bg-card justify-between">
            <Link 
              href="/admin/dashboard" 
              className={cn(
                "text-xl font-bold text-primary hover:text-primary/90 truncate transition-opacity",
                !isSidebarOpen && "opacity-0"
              )}
            >
              Admin
            </Link>
            <Button 
              variant="ghost" 
              size="icon" 
              className="md:flex"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            >
              {isSidebarOpen ? (
                <X className="h-4 w-4" />
              ) : (
                <Menu className="h-4 w-4" />
              )}
            </Button>
          </div>
          
          <ScrollArea className="flex-1">
            <div className="py-2">
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
                          <Icon className="h-5 w-5 flex-shrink-0" />
                          {isSidebarOpen && <span className="truncate">{item.label}</span>}
                        </div>
                        {isSidebarOpen && (
                          <div className="pl-10 space-y-1">
                            {item.submenu.map(subItem => (
                              <Link
                                key={subItem.href}
                                href={subItem.href}
                                className={cn(
                                  "block py-2 px-3 rounded-lg text-sm font-medium transition-colors truncate",
                                  pathname === subItem.href
                                    ? "bg-primary/10 text-primary dark:bg-primary/20"
                                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                                )}
                              >
                                {subItem.label}
                              </Link>
                            ))}
                          </div>
                        )}
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
                      <Icon className="h-5 w-5 flex-shrink-0" />
                      {isSidebarOpen && <span className="truncate">{item.label}</span>}
                    </Link>
                  )
                })}
                
                <button 
                  className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 hover:text-destructive-foreground transition-colors"
                  onClick={() => {
                    // Implementar logout
                  }}
                >
                  <LogOut className="h-5 w-5 flex-shrink-0" />
                  {isSidebarOpen && <span className="truncate">Sair</span>}
                </button>
              </nav>
            </div>
          </ScrollArea>
        </div>
      </aside>

      {/* Área de Conteúdo Principal */}
      <main className="flex-1 flex flex-col min-h-0 bg-background max-w-full">
        {/* Header Móvel */}
        <header className="md:hidden flex items-center h-14 px-4 border-b bg-card">
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="mr-4">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-[80%] max-w-[300px]">
              <div className="h-14 flex items-center px-6 border-b bg-card">
                <Link 
                  href="/admin/dashboard" 
                  className="text-xl font-bold text-primary hover:text-primary/90 truncate"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Admin
                </Link>
              </div>
              <ScrollArea className="h-[calc(100vh-3.5rem)]">
                <div className="py-2">
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
                              <Icon className="h-5 w-5 flex-shrink-0" />
                              <span className="truncate">{item.label}</span>
                            </div>
                            <div className="pl-10 space-y-1">
                              {item.submenu.map(subItem => (
                                <Link
                                  key={subItem.href}
                                  href={subItem.href}
                                  className={cn(
                                    "block py-2 px-3 rounded-lg text-sm font-medium transition-colors truncate",
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
                          <Icon className="h-5 w-5 flex-shrink-0" />
                          <span className="truncate">{item.label}</span>
                        </Link>
                      )
                    })}
                    
                    <button 
                      className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 hover:text-destructive-foreground transition-colors"
                      onClick={() => {
                        // Implementar logout
                      }}
                    >
                      <LogOut className="h-5 w-5 flex-shrink-0" />
                      <span className="truncate">Sair</span>
                    </button>
                  </nav>
                </div>
              </ScrollArea>
            </SheetContent>
          </Sheet>
          <span className="text-lg font-semibold truncate">Admin</span>
        </header>

        {/* Conteúdo */}
        <div className="flex-1 overflow-auto">
          <div className="h-full p-4 md:p-6 max-w-full">
            {children}
          </div>
        </div>
      </main>
    </div>
  )
} 