import { NextRequest, NextResponse } from 'next/server';
import { registrarUsuario, loginUsuario, SESSION_MAX_AGE } from '@/lib/auth';
import { cookies } from 'next/headers';
import { checkRateLimit, recordFailedAttempt, recordSuccessfulAttempt } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, username, senha } = body;

    if (!email || !username || !senha) {
      return NextResponse.json({ sucesso: false, erro: 'Todos os campos são obrigatórios' }, { status: 400 });
    }

    // Check rate limit by IP (prevent mass registration)
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const rateLimit = checkRateLimit(`register:${ip}`, ip);

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

    // Registrar (cria user + cidade)
    const resultado = await registrarUsuario(email, username, senha, username);

    if (resultado.sucesso) {
      // Successful registration — reset rate limit
      recordSuccessfulAttempt(`register:${ip}`, ip);

      // Auto-login após registro
      const resultadoLogin = await loginUsuario(username, senha);

      if (resultadoLogin.sucesso && resultadoLogin.sessionToken && resultadoLogin.jwtToken) {
        const cookieStore = await cookies();
        cookieStore.set('granpolis_session', resultadoLogin.sessionToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
          maxAge: SESSION_MAX_AGE,
        });
        cookieStore.set('granpolis_jwt', resultadoLogin.jwtToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
          maxAge: SESSION_MAX_AGE,
        });
      }

      return NextResponse.json({ sucesso: true });
    } else {
      // Failed registration — record attempt
      recordFailedAttempt(`register:${ip}`, ip);

      return NextResponse.json({ sucesso: false, erro: resultado.erro }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ sucesso: false, erro: 'Erro interno do servidor' }, { status: 500 });
  }
}
