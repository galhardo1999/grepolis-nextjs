import { NextResponse } from 'next/server';
import { limparSessionsExpiradas } from '@/lib/auth';

// Cron job para limpar sessions expiradas
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
    return NextResponse.json({ sucesso: true, mensagem: 'Sessions expiradas removidas' });
  } catch (error) {
    console.error('Erro ao limpar sessions:', error);
    return NextResponse.json({ erro: 'Erro ao limpar sessions' }, { status: 500 });
  }
}
