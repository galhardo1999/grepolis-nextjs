import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

// JWT secreta — falha em produção se não estiver definida
function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;

  if (!secret || secret === 'dev-secret-do-not-use-in-production-change-me') {
    if (process.env.NODE_ENV === 'production') {
      // Em produção, retorna vazio — o middleware vai falhar safe
      return new Uint8Array(0);
    }
    return new TextEncoder().encode('dev-secret-do-not-use-in-production-change-me');
  }

  return new TextEncoder().encode(secret);
}

const JWT_SECRET = getJwtSecret();

const COOKIE_SESSION = 'granpolis_session';
const COOKIE_JWT = 'granpolis_jwt';

export async function middleware(req: NextRequest) {
  const jwtCookie = req.cookies.get(COOKIE_JWT);
  const sessionCookie = req.cookies.get(COOKIE_SESSION);

  // Validar JWT no middleware (stateless — sem banco)
  let isValido = false;
  if (jwtCookie?.value && sessionCookie?.value && JWT_SECRET.length > 0) {
    try {
      await jwtVerify(jwtCookie.value, JWT_SECRET);
      isValido = true;
    } catch {
      // JWT inválido ou expirado
    }
  }

  // Rotas protegidas — incluindo API routes do jogo
  const protectedPaths = ['/game', '/api/game'];
  const isProtected = protectedPaths.some(path =>
    req.nextUrl.pathname.startsWith(path) ||
    req.nextUrl.pathname.startsWith('/api/game')
  );

  if (isProtected) {
    if (!isValido) {
      const loginUrl = new URL('/login', req.url);
      loginUrl.searchParams.set('redirect', req.nextUrl.pathname);
      const response = NextResponse.redirect(loginUrl);
      response.cookies.delete(COOKIE_JWT);
      response.cookies.delete(COOKIE_SESSION);
      return response;
    }
  }

  // Se estiver logado e tentar acessar login/registro, manda pro game
  if (isValido && (req.nextUrl.pathname === '/login' || req.nextUrl.pathname === '/registro')) {
    return NextResponse.redirect(new URL('/game', req.url));
  }

  // Landing page para não autenticados
  if (req.nextUrl.pathname === '/') {
    if (isValido) {
      return NextResponse.redirect(new URL('/game', req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/',
    '/login',
    '/registro',
    '/game/:path*',
    '/api/game/:path*',
  ],
};
