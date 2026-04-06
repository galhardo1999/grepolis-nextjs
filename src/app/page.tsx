import { redirect } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';
import Link from 'next/link';

export default async function HomePage() {
  const logado = await isAuthenticated();
  if (logado) {
    redirect('/game');
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(180deg, #0a1628 0%, #1a1040 50%, #0a1628 100%)',
        fontFamily: 'var(--font-outfit, sans-serif)',
        color: '#e2e8f0',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Decoração de fundo */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `radial-gradient(circle at 20% 50%, rgba(212,175,55,0.08) 0%, transparent 50%),
                           radial-gradient(circle at 80% 50%, rgba(212,175,55,0.05) 0%, transparent 50%)`,
          pointerEvents: 'none',
        }}
      />

      <div style={{ textAlign: 'center', position: 'relative', zIndex: 1, padding: '0 20px' }}>
        {/* Logo SVG */}
        <div style={{ marginBottom: '32px' }}>
          <svg width="80" height="80" viewBox="0 0 64 64" fill="none" style={{ margin: '0 auto', display: 'block' }}>
            <path d="M32 4L12 20v28h40V20L32 4zm0 6l14 11.5H18L32 10z" fill="#D4AF37" stroke="#998030" strokeWidth="1.5" />
            <rect x="24" y="30" width="16" height="18" rx="1" fill="#D4AF37" stroke="#998030" strokeWidth="1" />
            <circle cx="32" cy="18" r="3" fill="#0a1628" />
            <path d="M8 24h4v24H8zM52 24h4v24h-4z" fill="#D4AF37" stroke="#998030" strokeWidth="1" />
          </svg>
        </div>

        <h1
          style={{
            fontFamily: 'var(--font-cinzel, serif)',
            fontSize: '3.5rem',
            fontWeight: 900,
            color: '#D4AF37',
            margin: '0 0 12px 0',
            letterSpacing: '4px',
            textShadow: '0 2px 20px rgba(212,175,55,0.3)',
          }}
        >
          GRANPOLIS
        </h1>

        <p style={{ fontSize: '1.2rem', color: '#8a9ab5', margin: '0 0 40px 0', maxWidth: '500px' }}>
          Construa sua cidade, treine seu exército e domine a Grécia antiga.
        </p>

        {/* Botão principal */}
        <Link
          href="/registro"
          style={{
            display: 'inline-block',
            padding: '16px 48px',
            background: 'linear-gradient(135deg, #7d5200, #D4AF37)',
            border: '1px solid #D4AF37',
            borderRadius: '12px',
            color: '#fff',
            fontSize: '1.1rem',
            fontWeight: 700,
            fontFamily: 'var(--font-cinzel, serif)',
            textDecoration: 'none',
            letterSpacing: '2px',
            boxShadow: '0 4px 20px rgba(212,175,55,0.3)',
            marginBottom: '24px',
          }}
        >
          COMEÇAR AGORA
        </Link>

        <div style={{ display: 'flex', gap: '24px', justifyContent: 'center', marginTop: '12px' }}>
          <Link
            href="/login"
            style={{
              color: '#D4AF37',
              textDecoration: 'none',
              fontSize: '0.95rem',
              fontWeight: 600,
              padding: '8px 24px',
              border: '1px solid rgba(212,175,55,0.3)',
              borderRadius: '8px',
              background: 'rgba(212,175,55,0.05)',
            }}
          >
            Entrar
          </Link>
          <Link
            href="/registro"
            style={{
              color: '#D4AF37',
              textDecoration: 'none',
              fontSize: '0.95rem',
              fontWeight: 600,
              padding: '8px 24px',
              border: '1px solid rgba(212,175,55,0.3)',
              borderRadius: '8px',
              background: 'rgba(212,175,55,0.05)',
            }}
          >
            Registrar
          </Link>
        </div>

        {/* Features */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '24px',
            marginTop: '80px',
            maxWidth: '700px',
            margin: '80px auto 0',
          }}
        >
          {[
            { icon: '🏛️', title: 'Construa', desc: 'Edifique templos, quartéis e portos' },
            { icon: '⚔️', title: 'Conquiste', desc: 'Treine tropas e saqueie aldeias bárbaras' },
            { icon: '📜', title: 'Pesquise', desc: 'Desbloqueie tecnologias na academia' },
          ].map((f) => (
            <div
              key={f.title}
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(212,175,55,0.15)',
                borderRadius: '12px',
                padding: '24px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '2rem', marginBottom: '12px' }}>{f.icon}</div>
              <h3
                style={{
                  fontFamily: 'var(--font-cinzel, serif)',
                  color: '#D4AF37',
                  margin: '0 0 8px 0',
                  fontSize: '1rem',
                }}
              >
                {f.title}
              </h3>
              <p style={{ color: '#8a9ab5', margin: 0, fontSize: '0.85rem' }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
