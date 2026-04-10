"use client";

import React from 'react';

// ============================================================
// MODAL DE CONFIRMAÇÃO CUSTOMIZADO
// UX-02: Substituição de window.confirm bloqueante
// ============================================================

interface ModalConfirmacaoProps {
  aberto: boolean;
  titulo: string;
  mensagem: string;
  textoBotaoConfirmar?: string;
  textoBotaoCancelar?: string;
  tipo?: 'perigo' | 'aviso' | 'info';
  aoConfirmar: () => void;
  aoCancelar: () => void;
}

export const ModalConfirmacao = React.memo(function ModalConfirmacao({
  aberto,
  titulo,
  mensagem,
  textoBotaoConfirmar = 'Confirmar',
  textoBotaoCancelar = 'Cancelar',
  tipo = 'aviso',
  aoConfirmar,
  aoCancelar
}: ModalConfirmacaoProps) {
  if (!aberto) return null;

  const config = {
    perigo: { cor: '#ef4444', icone: '⚠️', corBotao: '#7f1d1d', corBotaoHover: '#dc2626' },
    aviso:  { cor: '#f59e0b', icone: '⚡', corBotao: '#78350f', corBotaoHover: '#d97706' },
    info:   { cor: '#3b82f6', icone: 'ℹ️', corBotao: '#1e3a5f', corBotaoHover: '#2563eb' }
  }[tipo];

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 10000,
        background: 'rgba(2, 6, 23, 0.85)',
        backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        animation: 'fadeIn 0.2s ease'
      }}
      onClick={aoCancelar}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'linear-gradient(160deg, #0d1b2a, #1a2744)',
          border: `1px solid ${config.cor}60`,
          borderRadius: '12px',
          padding: '32px',
          maxWidth: '420px',
          width: '90%',
          boxShadow: `0 8px 40px rgba(0,0,0,0.7), 0 0 30px ${config.cor}20`,
          animation: 'modalPop 0.25s ease'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <span style={{ fontSize: '2rem' }}>{config.icone}</span>
          <h3 style={{ color: config.cor, fontFamily: 'var(--font-heading)', margin: 0, fontSize: '1.2rem' }}>
            {titulo}
          </h3>
        </div>
        <p style={{ color: '#c9d1d9', lineHeight: 1.6, margin: '0 0 24px', fontSize: '0.95rem' }}>
          {mensagem}
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button
            onClick={aoCancelar}
            style={{
              background: 'transparent',
              border: '1px solid #374151',
              color: '#9ca3af',
              borderRadius: '6px',
              padding: '8px 20px',
              cursor: 'pointer',
              fontFamily: 'var(--font-body)',
              transition: 'all 0.2s'
            }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = '#6b7280')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = '#374151')}
          >
            {textoBotaoCancelar}
          </button>
          <button
            onClick={aoConfirmar}
            style={{
              background: config.corBotao,
              border: `1px solid ${config.cor}`,
              color: '#fff',
              borderRadius: '6px',
              padding: '8px 20px',
              cursor: 'pointer',
              fontFamily: 'var(--font-body)',
              fontWeight: 700,
              transition: 'all 0.2s'
            }}
            onMouseEnter={e => (e.currentTarget.style.background = config.corBotaoHover)}
            onMouseLeave={e => (e.currentTarget.style.background = config.corBotao)}
          >
            {textoBotaoConfirmar}
          </button>
        </div>
      </div>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes modalPop { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
      `}</style>
    </div>
  );
});
