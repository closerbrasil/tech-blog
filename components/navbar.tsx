"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { MoonIcon, SunIcon, SearchIcon, MenuIcon, XIcon, Laptop2Icon } from "lucide-react";
import { useTheme } from "next-themes";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle
} from "@/components/ui/navigation-menu";
import {
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from '@clerk/nextjs';

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { setTheme } = useTheme();

  return (
    <nav className="border-b bg-background sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <Laptop2Icon className="h-6 w-6" />
            <span className="text-xl font-bold">CloserAI</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <Link href="/articles" legacyBehavior passHref>
                    <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                      Artigos
                    </NavigationMenuLink>
                  </Link>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <Link href="/videos" legacyBehavior passHref>
                    <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                      Vídeos
                    </NavigationMenuLink>
                  </Link>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <NavigationMenuTrigger>Categorias</NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid gap-3 p-6 md:w-[400px] lg:w-[500px] lg:grid-cols-2">
                      <li className="row-span-3">
                        <Link href="/category/popular" legacyBehavior passHref>
                          <NavigationMenuLink className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-muted/50 to-muted p-6 no-underline outline-none focus:shadow-md">
                            <div className="mb-2 mt-4 text-lg font-medium">Tópicos Populares</div>
                            <p className="text-sm leading-tight text-muted-foreground">
                              Descubra os tópicos mais visualizados e discutidos
                            </p>
                          </NavigationMenuLink>
                        </Link>
                      </li>
                      <li>
                        <Link href="/category/web-development" legacyBehavior passHref>
                          <NavigationMenuLink className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground">
                            <div className="text-sm font-medium leading-none">Desenvolvimento Web</div>
                            <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                              Frontend, backend, e desenvolvimento full-stack
                            </p>
                          </NavigationMenuLink>
                        </Link>
                      </li>
                      <li>
                        <Link href="/category/machine-learning" legacyBehavior passHref>
                          <NavigationMenuLink className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground">
                            <div className="text-sm font-medium leading-none">Machine Learning</div>
                            <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                              IA, algoritmos de ML e recursos de ciência de dados
                            </p>
                          </NavigationMenuLink>
                        </Link>
                      </li>
                      <li>
                        <Link href="/category/devops" legacyBehavior passHref>
                          <NavigationMenuLink className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground">
                            <div className="text-sm font-medium leading-none">DevOps</div>
                            <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                              CI/CD, Docker, Kubernetes e infraestrutura de nuvem
                            </p>
                          </NavigationMenuLink>
                        </Link>
                      </li>
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <Link href="/pricing" legacyBehavior passHref>
                    <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                      Preços
                    </NavigationMenuLink>
                  </Link>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          </div>

          {/* Search and Auth Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            <form className="relative w-full max-w-sm">
              <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Pesquisar..."
                className="pl-8 w-full md:w-[200px] lg:w-[300px]"
              />
            </form>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <SunIcon className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                  <MoonIcon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                  <span className="sr-only">Alternar tema</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setTheme("light")}>
                  Claro
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("dark")}>
                  Escuro
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("system")}>
                  Sistema
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <SignedIn>
              <UserButton afterSignOutUrl="/" />
            </SignedIn>
            <SignedOut>
              <div className="flex items-center space-x-2">
                <SignInButton>
                  <Button variant="ghost">
                    Entrar
                  </Button>
                </SignInButton>
                <SignUpButton>
                  <Button>Cadastrar</Button>
                </SignUpButton>
              </div>
            </SignedOut>
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center space-x-2">
            <Button variant="ghost" size="icon" onClick={() => {/* Open search */}}>
              <SearchIcon className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <XIcon className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden px-4 py-2 pb-4 border-t">
          <div className="flex flex-col space-y-3">
            <Link href="/articles" className="px-3 py-2 rounded-md hover:bg-accent" onClick={() => setIsMenuOpen(false)}>
              Artigos
            </Link>
            <Link href="/videos" className="px-3 py-2 rounded-md hover:bg-accent" onClick={() => setIsMenuOpen(false)}>
              Vídeos
            </Link>
            <Link href="/categories" className="px-3 py-2 rounded-md hover:bg-accent" onClick={() => setIsMenuOpen(false)}>
              Categorias
            </Link>
            <Link href="/pricing" className="px-3 py-2 rounded-md hover:bg-accent" onClick={() => setIsMenuOpen(false)}>
              Preços
            </Link>
            <SignedIn>
              <Link href="/dashboard" className="px-3 py-2 rounded-md hover:bg-accent" onClick={() => setIsMenuOpen(false)}>
                Painel
              </Link>
              <UserButton afterSignOutUrl="/" />
            </SignedIn>
            <SignedOut>
              <div className="flex flex-col space-y-2">
                <SignInButton>
                  <Button variant="outline" onClick={() => setIsMenuOpen(false)}>
                    Entrar
                  </Button>
                </SignInButton>
                <SignUpButton>
                  <Button onClick={() => setIsMenuOpen(false)}>
                    Cadastrar
                  </Button>
                </SignUpButton>
              </div>
            </SignedOut>
          </div>
        </div>
      )}
    </nav>
  );
}