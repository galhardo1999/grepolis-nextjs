import { NextResponse } from 'next/server';
import { limparSessionsExpiradas } from '@/lib/auth';
import { cleanupRateLimitStore } from '@/lib/rate-limit';

// Cron job para limpar sessions expiradas e rate limits antigos
// Configurar na Vercel: /api/cron/cleanup-sessions
// Frequência recomendada: a cada 1 hora

export async function GET(req: Request) {
  // Verificar autorização via cron secret
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 });
  }

  try {
    await limparSessionsExpiradas();
    await cleanupRateLimitStore();
    return NextResponse.json({ sucesso: true, mensagem: 'Sessions expiradas e rate limits removidos' });
  } catch (error) {
    console.error('Erro ao limpar sessions e rate limits:', error);
    return NextResponse.json({ erro: 'Erro ao limpar sessions e rate limits' }, { status: 500 });
  }
}
