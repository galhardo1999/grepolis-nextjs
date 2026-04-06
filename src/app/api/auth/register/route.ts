import { NextRequest, NextResponse } from 'next/server';
import { registrarUsuario } from '@/lib/auth';
import { cookies } from 'next/headers';

const COOKIE_NAME = 'granpolis_session';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, username, senha } = body;

    if (!email || !username || !senha) {
      return NextResponse.json({ sucesso: false, erro: 'Todos os campos são obrigatórios' }, { status: 400 });
    }

    // Registrar (cria user + cidade)
    const resultado = await registrarUsuario(email, username, senha, username);

    if (resultado.sucesso) {
      // Auto-login após registro
      const { loginUsuario } = await import('@/lib/auth');
      await loginUsuario(username, senha);

      return NextResponse.json({ sucesso: true });
    } else {
      return NextResponse.json({ sucesso: false, erro: resultado.erro }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ sucesso: false, erro: 'Erro interno do servidor' }, { status: 500 });
  }
}
