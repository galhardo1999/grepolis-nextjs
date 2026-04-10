"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    setCarregando(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, senha }),
      });

      const data = await res.json();

      if (data.sucesso) {
        router.push('/game');
        router.refresh();
      } else {
        setErro(data.erro || 'Erro ao fazer login');
      }
    } catch {
      setErro('Erro de conexão. Tente novamente.');
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(rgba(10, 22, 40, 0.7), rgba(10, 22, 40, 0.7)), url(/images/login-bg.png)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      fontFamily: 'var(--font-outfit, sans-serif)',
    }}>
      <div style={{
        background: 'linear-gradient(160deg, #0d1b2a, #1a2744)',
        border: '1px solid #D4AF37',
        borderRadius: '16px',
        padding: '48px 40px',
        maxWidth: '420px',
        width: '90%',
        boxShadow: '0 8px 40px rgba(0,0,0,0.7), 0 0 30px rgba(212,175,55,0.1)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{
            color: '#D4AF37',
            fontFamily: 'var(--font-cinzel, serif)',
            fontSize: '2rem',
            margin: '0 0 8px 0',
          }}>
            Granpolis
          </h1>
          <p style={{ color: '#8a9ab5', margin: 0, fontSize: '0.95rem' }}>
            Entre na sua cidade
          </p>
        </div>

        {erro && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '8px',
            padding: '12px 16px',
            color: '#fca5a5',
            fontSize: '0.85rem',
            marginBottom: '20px',
          }}>
            {erro}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', color: '#8a9ab5', fontSize: '0.85rem', marginBottom: '6px' }}>
              Usuário
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoComplete="username"
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '8px',
                border: '1px solid #2a3a5a',
                background: '#0a1628',
                color: '#e2e8f0',
                fontSize: '1rem',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', color: '#8a9ab5', fontSize: '0.85rem', marginBottom: '6px' }}>
              Senha
            </label>
            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
              autoComplete="current-password"
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '8px',
                border: '1px solid #2a3a5a',
                background: '#0a1628',
                color: '#e2e8f0',
                fontSize: '1rem',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <button
            type="submit"
            disabled={carregando}
            style={{
              width: '100%',
              padding: '14px',
              background: carregando ? '#4a3200' : 'linear-gradient(135deg, #7d5200, #D4AF37)',
              border: '1px solid #D4AF37',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '1rem',
              fontWeight: 700,
              fontFamily: 'var(--font-cinzel, serif)',
              cursor: carregando ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              marginTop: '8px',
            }}
          >
            {carregando ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <p style={{
          textAlign: 'center',
          color: '#8a9ab5',
          fontSize: '0.85rem',
          marginTop: '24px',
        }}>
          Não tem conta?{' '}
          <a
            href="/registro"
            style={{ color: '#D4AF37', textDecoration: 'none', fontWeight: 700 }}
          >
            Registrar
          </a>
        </p>
      </div>
    </div>
  );
}
