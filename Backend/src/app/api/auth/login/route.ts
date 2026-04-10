import { NextRequest, NextResponse } from 'next/server';
import { loginUsuario } from '@/lib/auth';
import { cookies } from 'next/headers';
import { SESSION_MAX_AGE } from '@/lib/auth';
import { checkRateLimit, recordFailedAttempt, recordSuccessfulAttempt } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, senha } = body;

    if (!username || !senha) {
      return NextResponse.json({ sucesso: false, erro: 'Usuário e senha são obrigatórios' }, { status: 400 });
    }

    // Check rate limit by username and IP (agora assíncrono - usa banco de dados)
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const rateLimit = await checkRateLimit(username.toLowerCase(), ip);

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { sucesso: false, erro: rateLimit.error },
        {
          status: 429,
          headers: {
            'Retry-After': rateLimit.resetTime ? Math.ceil((rateLimit.resetTime - Date.now()) / 1000).toString() : '900',
            'X-RateLimit-Remaining': '0',
          },
        }
      );
    }

    const resultado = await loginUsuario(username, senha);

    if (resultado.sucesso && resultado.sessionToken && resultado.jwtToken) {
      // Successful login — reset rate limit
      recordSuccessfulAttempt(username.toLowerCase(), ip);

      const cookieStore = await cookies();
      cookieStore.set('granpolis_session', resultado.sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: SESSION_MAX_AGE,
      });
      cookieStore.set('granpolis_jwt', resultado.jwtToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: SESSION_MAX_AGE,
      });
      return NextResponse.json({ sucesso: true });
    } else {
      // Failed login — record attempt
      recordFailedAttempt(username.toLowerCase(), ip);

      return NextResponse.json({ sucesso: false, erro: resultado.erro }, { status: 401 });
    }
  } catch {
    return NextResponse.json({ sucesso: false, erro: 'Erro interno do servidor' }, { status: 500 });
  }
}
