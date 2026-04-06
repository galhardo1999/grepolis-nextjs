import { NextRequest, NextResponse } from 'next/server';
import { loginUsuario } from '@/lib/auth';
import { cookies } from 'next/headers';
import { SESSION_MAX_AGE } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, senha } = body;

    if (!username || !senha) {
      return NextResponse.json({ sucesso: false, erro: 'Usuário e senha são obrigatórios' }, { status: 400 });
    }

    const resultado = await loginUsuario(username, senha);

    if (resultado.sucesso && resultado.sessionToken && resultado.jwtToken) {
      const cookieStore = await cookies();
      cookieStore.set('granpolis_session', resultado.sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: SESSION_MAX_AGE,
      });
      cookieStore.set('granpolis_jwt', resultado.jwtToken, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: SESSION_MAX_AGE,
      });
      return NextResponse.json({ sucesso: true });
    } else {
      return NextResponse.json({ sucesso: false, erro: resultado.erro }, { status: 401 });
    }
  } catch {
    return NextResponse.json({ sucesso: false, erro: 'Erro interno do servidor' }, { status: 500 });
  }
}
