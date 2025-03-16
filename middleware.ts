import { NextResponse } from 'next/server'
import { clerkMiddleware } from "@clerk/nextjs/server";

// Exporta o middleware do Clerk como padrão
export default clerkMiddleware(async (auth, req) => {
  // Adiciona um header personalizado para identificar rotas admin
  if (req.nextUrl.pathname.startsWith('/admin')) {
    const response = NextResponse.next();
    response.headers.set('x-route-type', 'admin');
    return response;
  }

  // Para outras rotas, apenas continua a execução
  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}; 