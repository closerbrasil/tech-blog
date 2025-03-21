import './globals.css';
import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as SonnerToaster } from '@/components/ui/sonner';
import { Providers } from '@/app/providers';
import ClientLayout from '@/components/client-layout';
import { ClerkProvider } from '@clerk/nextjs';

const geistSans = GeistSans;
const geistMono = GeistMono;

export const metadata: Metadata = {
  title: 'CloserAI – Tudo sobre Inteligência Artificial em um só lugar',
  description: 'Aprenda Inteligência Artificial do básico ao avançado, domine APIs, ferramentas e técnicas inovadoras e esteja à frente da revolução tecnológica!',
  keywords: 'Inteligência Artificial, IA, Machine Learning, Deep Learning, ChatGPT, API, Ferramentas, Técnicas, Revolução Tecnológica',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="pt-BR" suppressHydrationWarning className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <body>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <Providers>
              <ClientLayout>{children}</ClientLayout>
              <Toaster />
              <SonnerToaster />
            </Providers>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}