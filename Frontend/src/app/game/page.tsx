import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { GameClient } from './GameClient';
import { cookies } from 'next/headers';

export default async function GamePage() {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('granpolis_session');
  const jwtToken = cookieStore.get('granpolis_jwt');
  
  if (!sessionToken || !jwtToken) {
    redirect('/login');
  }

  // Fetch the latest state from the backend API directly using cookies for authentication
  const req = await fetch('http://localhost:3001/api/game/sync', {
    headers: {
      Cookie: `granpolis_session=${sessionToken.value}; granpolis_jwt=${jwtToken.value}`
    },
    cache: 'no-store'
  });

  if (!req.ok) {
    if (req.status === 404) {
      redirect('/registro');
    }
    // If unauthorized or other error
    redirect('/login');
  }

  const estadoInicial = await req.json();

  return <GameClient estadoInicial={estadoInicial} usuario={session} />;
}
