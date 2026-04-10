"use client";

import React from 'react';

interface ModalWrapperProps {
  children: React.ReactNode;
  fechar: () => void;
  titulo?: string;
  larguraMaxima?: string;
  className?: string;
}

/**
 * Componente reutilizável que encapsula o boilerplate de overlay/content
 * comum a todos os modais do projeto.
 *
 * Uso:
 * <ModalWrapper fechar={() => setModal(null)} titulo="Título">
 *   <Conteúdo do Modal />
 * </ModalWrapper>
 */
export const ModalWrapper = React.memo(function ModalWrapper({
  children,
  fechar,
  titulo,
  larguraMaxima = '600px',
  className = '',
}: ModalWrapperProps) {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={fechar}
    >
      <div
        className={className}
        style={{
          background: 'linear-gradient(135deg, #f5e6d3 0%, #e8d5b7 100%)',
          borderRadius: '8px',
          padding: '20px',
          maxWidth: larguraMaxima,
          width: '90%',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          position: 'relative',
        }}
        onClick={e => e.stopPropagation()}
      >
        {titulo && (
          <div
            style={{
              fontSize: '1.2rem',
              fontWeight: 'bold',
              color: '#4e342e',
              marginBottom: '12px',
              borderBottom: '2px solid #8d6e63',
              paddingBottom: '8px',
            }}
          >
            {titulo}
          </div>
        )}
        {children}
      </div>
    </div>
  );
});
