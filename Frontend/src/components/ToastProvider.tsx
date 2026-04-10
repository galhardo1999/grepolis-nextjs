"use client";

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

// ============================================================
// SISTEMA DE NOTIFICAÇÕES TOAST
// UX-01: Feedback visual para todas as ações do jogo
// ============================================================

export type ToastTipo = 'sucesso' | 'erro' | 'info' | 'aviso';

interface Toast {
  id: number;
  mensagem: React.ReactNode;
  tipo: ToastTipo;
  icone?: React.ReactNode;
}

interface ToastContextType {
  mostrarToast: (mensagem: React.ReactNode, tipo?: ToastTipo, icone?: React.ReactNode) => void;
}

const ToastContext = createContext<ToastContextType>({ mostrarToast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const contadorRef = useRef(0);
  // Rastrear timeouts para cleanup
  const timeoutsRef = useRef<Map<number, NodeJS.Timeout>>(new Map());

  const mostrarToast = useCallback((mensagem: React.ReactNode, tipo: ToastTipo = 'info', icone?: React.ReactNode) => {
    const id = ++contadorRef.current;
    setToasts(prev => [...prev.slice(-4), { id, mensagem, tipo, icone }]);

    // Limpar timeout anterior se existir para este id
    const timeoutAnterior = timeoutsRef.current.get(id);
    if (timeoutAnterior) clearTimeout(timeoutAnterior);

    const timeout = setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
      timeoutsRef.current.delete(id);
    }, 3500);
    timeoutsRef.current.set(id, timeout);
  }, []);

  // Cleanup de todos os timeouts ao desmontar
  React.useEffect(() => {
    return () => {
      timeoutsRef.current.forEach(timeout => clearTimeout(timeout));
      timeoutsRef.current.clear();
    };
  }, []);

  const iconePadrao: Record<ToastTipo, string> = {
    sucesso: '✅',
    erro: '❌',
    info: 'ℹ️',
    aviso: '⚠️'
  };

  const corFundo: Record<ToastTipo, string> = {
    sucesso: 'linear-gradient(to bottom, #f5e6ba, #dbbc7f)',
    erro: 'linear-gradient(135deg, #4a1010, #7f1d1d)',
    info: 'linear-gradient(135deg, #0c2547, #1e3a5f)',
    aviso: 'linear-gradient(135deg, #4a3200, #7d5200)'
  };

  const corBorda: Record<ToastTipo, string> = {
    sucesso: '#6d4c41',
    erro: '#ef4444',
    info: '#3b82f6',
    aviso: '#f59e0b'
  };

  const corTexto: Record<ToastTipo, string> = {
    sucesso: '#3e2723',
    erro: '#fff',
    info: '#fff',
    aviso: '#fff'
  };

  return (
    <ToastContext.Provider value={{ mostrarToast }}>
      {children}
      <div
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          alignItems: 'flex-end',
          pointerEvents: 'none'
        }}
      >
        {toasts.map(toast => (
          <div
            key={toast.id}
            style={{
              background: corFundo[toast.tipo],
              border: `1px solid ${corBorda[toast.tipo]}`,
              borderRadius: '8px',
              padding: '10px 20px',
              color: corTexto[toast.tipo],
              fontFamily: 'var(--font-body, Arial)',
              fontSize: '0.9rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              boxShadow: `0 4px 20px rgba(0,0,0,0.5), 0 0 12px ${corBorda[toast.tipo]}40`,
              animation: 'toastSlideIn 0.3s ease',
              backdropFilter: 'blur(10px)',
              whiteSpace: 'nowrap',
              maxWidth: '420px'
            }}
          >
            <span style={{ fontSize: '1.1rem' }}>{toast.icone ?? iconePadrao[toast.tipo]}</span>
            <span>{toast.mensagem}</span>
          </div>
        ))}
      </div>
      <style>{`
        @keyframes toastSlideIn {
          from { opacity: 0; transform: translateY(16px) scale(0.95); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </ToastContext.Provider>
  );
}
