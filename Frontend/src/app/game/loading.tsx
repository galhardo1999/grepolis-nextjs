export default function GameLoading() {
  return (
    <div
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
      }}
    >
      <div style={{ animation: 'spin 1.5s linear infinite' }}>
        <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
          <path
            d="M32 4L12 20v28h40V20L32 4zm0 6l14 11.5H18L32 10z"
            fill="#D4AF37"
            stroke="#998030"
            strokeWidth="1.5"
          />
          <rect x="24" y="30" width="16" height="18" rx="1" fill="#D4AF37" stroke="#998030" strokeWidth="1"/>
          <circle cx="32" cy="18" r="3" fill="#050E1A"/>
          <path d="M8 24h4v24H8zM52 24h4v24h-4z" fill="#D4AF37" stroke="#998030" strokeWidth="1"/>
        </svg>
      </div>
      <h1 style={{ fontSize: '1.8rem', margin: 0 }}>Carregando Pólis...</h1>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
