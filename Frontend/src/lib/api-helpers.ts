// ============================================================
// WRAPPER WITHAUTH — Elimina repetição de validação de sessão
// em todas as rotas da API
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { getSession, AuthSession } from '@/lib/auth';

export type Handler = (req: NextRequest, session: AuthSession) => Promise<NextResponse>;

/**
 * Envolve um handler de rota com validação de autenticação.
 * Se a sessão não existir, retorna 401 automaticamente.
 */
export function withAuth(handler: Handler) {
  return async function authenticatedHandler(req: NextRequest) {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ erro: 'Não autenticado' }, { status: 401 });
    }
    return handler(req, session);
  };
}

/**
 * Wrapper opcional — retorna sessão mesmo se não autenticado.
 * Útil para rotas que funcionam melhor com sessão mas não exigem.
 */
export function withOptionalAuth(
  handler: (req: NextRequest, session: AuthSession | null) => Promise<NextResponse>
) {
  return async function optionalAuthHandler(req: NextRequest) {
    const session = await getSession();
    return handler(req, session);
  };
}
