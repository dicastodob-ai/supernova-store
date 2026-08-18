import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const host = request.headers.get('host') || '';
  const { pathname } = request.nextUrl;

  // Si el hostname contiene 'getkinship' (tanto getkinship.onrender.com como getkinship.humancentric.online)
  if (host.toLowerCase().includes('getkinship')) {
    // Si la ruta solicitada es la raíz '/', reescribe internamente hacia la landing D2C '/kinship'
    if (pathname === '/') {
      return NextResponse.rewrite(new URL('/kinship', request.url));
    }
  }

  // Para cualquier otro host (supernovastore...), continúa sirviendo la ruta normal de la Mega Store.
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Intercepta rutas de páginas evitando archivos estáticos y rutas de API
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf|css|js)$).*)',
  ],
};
