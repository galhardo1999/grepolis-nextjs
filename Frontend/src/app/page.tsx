import { redirect } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';
import Link from 'next/link';
import styles from './page.module.css';

export default async function HomePage() {
  const logado = await isAuthenticated();
  if (logado) {
    redirect('/game');
  }

  const features = [
    { icon: '🏛️', title: 'Construa', desc: 'Edifique templos, quartéis e portos' },
    { icon: '⚔️', title: 'Conquiste', desc: 'Treine tropas e saqueie aldeias bárbaras' },
    { icon: '📜', title: 'Pesquise', desc: 'Desbloqueie tecnologias na academia' },
  ];

  return (
    <div className={styles.wrapper}>
      {/* Overlay escuro */}
      <div className={styles.overlay} />
      {/* Brilho dourado */}
      <div className={styles.glow} />

      <div className={styles.content}>
        {/* Logo SVG */}
        <div className={styles.logoWrap}>
          <svg width="80" height="80" viewBox="0 0 64 64" fill="none">
            <path d="M32 4L12 20v28h40V20L32 4zm0 6l14 11.5H18L32 10z" fill="#D4AF37" stroke="#998030" strokeWidth="1.5" />
            <rect x="24" y="30" width="16" height="18" rx="1" fill="#D4AF37" stroke="#998030" strokeWidth="1" />
            <circle cx="32" cy="18" r="3" fill="#0a1628" />
            <path d="M8 24h4v24H8zM52 24h4v24h-4z" fill="#D4AF37" stroke="#998030" strokeWidth="1" />
          </svg>
        </div>

        <h1 className={styles.title}>GRANPOLIS</h1>

        <p className={styles.subtitle}>
          Construa sua cidade, treine seu exército e domine a Grécia antiga.
        </p>

        {/* Botão principal */}
        <Link href="/registro" className={styles.btnPrimary}>
          COMEÇAR AGORA
        </Link>

        {/* Links secundários */}
        <div className={styles.links}>
          <Link href="/login" className={styles.btnSecondary}>
            Entrar
          </Link>
          <Link href="/registro" className={styles.btnSecondary}>
            Registrar
          </Link>
        </div>

        {/* Cards de features */}
        <div className={styles.features}>
          {features.map((f) => (
            <div key={f.title} className={styles.featureCard}>
              <div className={styles.featureIcon}>{f.icon}</div>
              <div className={styles.featureContent}>
                <h3 className={styles.featureTitle}>{f.title}</h3>
                <p className={styles.featureDesc}>{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
