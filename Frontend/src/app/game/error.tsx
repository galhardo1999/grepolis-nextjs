"use client";

export default function GameError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div
      id="game-error"
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: '#050E1A',
        color: '#D4AF37',
        fontFamily: 'var(--font-cinzel)',
        gap: '20px',
        padding: '20px',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          width: '64px',
          height: '64px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: 0.6,
        }}
      >
        <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
          <circle cx="32" cy="32" r="28" stroke="#D4AF37" strokeWidth="2" opacity="0.5"/>
          <text x="32" y="40" textAnchor="middle" fill="#D4AF37" fontSize="32" fontFamily="var(--font-cinzel)">!</text>
        </svg>
      </div>
      <h1 style={{ fontSize: '1.8rem', margin: 0 }}>Os deuses estão em silêncio...</h1>
      <p style={{ color: '#aaa', fontSize: '1rem', maxWidth: '500px' }}>
        Ocorreu um erro ao carregar sua cidade. Isso pode ter acontecido porque os servidores do
        Olímpio estão temporariamente indisponíveis ou sua conexão foi interrompida.
      </p>
      {process.env.NODE_ENV === 'development' && error.message && (
        <pre
          style={{
            background: 'rgba(255,255,255,0.05)',
            padding: '12px',
            borderRadius: '6px',
            fontSize: '0.8rem',
            color: '#f87171',
            maxWidth: '600px',
            overflow: 'auto',
          }}
        >
          {error.message}
        </pre>
      )}
      <button
        onClick={reset}
        style={{
          background: 'linear-gradient(135deg, #D4AF37, #998030)',
          border: 'none',
          borderRadius: '8px',
          padding: '12px 32px',
          fontSize: '1rem',
          fontWeight: 'bold',
          fontFamily: 'var(--font-cinzel)',
          color: '#050E1A',
          cursor: 'pointer',
          marginTop: '10px',
          transition: 'transform 0.2s',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
        onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
      >
        Reconectar aos Olímpianos
      </button>
    </div>
  );
}
