"use client";

import React, { useEffect } from 'react';
import Image from 'next/image';
import { MISSOES } from '@/lib/missoes';
import { useGameStore } from '@/store/gameStore';
import { useToast } from './ToastProvider';

export function ModalMissoes({ aberto, aoFechar }: { aberto: boolean; aoFechar: () => void }) {
  const { mostrarToast } = useToast();
  
  // Assinar tudo que pode alterar conclusão das missões
  const edificios = useGameStore(s => s.edificios);
  const unidades = useGameStore(s => s.unidades);
  const missoesColetadas = useGameStore(s => s.missoesColetadas);
  const coletarRecompensaMissao = useGameStore(s => s.coletarRecompensaMissao);

  // Precisamos do estado inteiro para passar pra funcao de check das missoes
  const estadoCompleto = useGameStore(s => s);

  useEffect(() => {
    const escListener = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && aberto) aoFechar();
    };
    window.addEventListener('keydown', escListener);
    return () => window.removeEventListener('keydown', escListener);
  }, [aberto, aoFechar]);

  if (!aberto) return null;

  const renderizarRecompensas = (recompensa: any) => {
    return (
      <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
        {recompensa.madeira && (
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.9rem', color: '#8b4513' }}>
            <Image src="/icon_wood.png" width={16} height={16} alt="Madeira" /> +{recompensa.madeira}
          </span>
        )}
        {recompensa.pedra && (
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.9rem', color: '#555' }}>
            <Image src="/icon_stone.png" width={16} height={16} alt="Pedra" /> +{recompensa.pedra}
          </span>
        )}
        {recompensa.prata && (
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.9rem', color: '#708090' }}>
            <Image src="/icon_silver.png" width={16} height={16} alt="Prata" /> +{recompensa.prata}
          </span>
        )}
        {recompensa.favor && (
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.9rem', color: '#1e3a8a' }}>
            <span style={{ fontSize: '1rem', lineHeight: '16px' }}>⚡</span> +{recompensa.favor}
          </span>
        )}
      </div>
    );
  };

  const handleColetar = (id: string, recom: any) => {
    const res = coletarRecompensaMissao(id, recom);
    if (res.sucesso) {
      mostrarToast('Recompensa coletada com sucesso!', 'sucesso');
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('recurso-ganho', { detail: recom }));
      }
    } else {
      mostrarToast(res.motivo || 'Erro ao coletar', 'erro');
    }
  };

  return (
    <div id="modal-overlay" onClick={(e) => e.target === e.currentTarget && aoFechar()}>
      <div id="modal-container" className="senate-wide" style={{ width: '800px' }}>
        <div id="modal-header">
          <h2 id="modal-title">⚔️ Missões e Recompensas</h2>
          <button id="close-modal" onClick={aoFechar}>&times;</button>
        </div>
        <div id="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          
          <p style={{ marginBottom: '10px', fontSize: '1.05rem', color: '#3e2723' }}>
            Complete tarefas de infraestrutura e exército para garantir a prosperidade e ajuda divina no desenvolvimento inicial.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(1, 1fr)', gap: '15px' }}>
            {(() => {
              const indexAtiva = MISSOES.findIndex(m => !missoesColetadas.includes(m.id));
              
              if (indexAtiva === -1) {
                return (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#3e2723', background: '#fff8e1', borderRadius: '10px', border: '2px solid #D4AF37' }}>
                    <h3 style={{ margin: '0 0 10px 0', color: '#D4AF37' }}>🌟 Império Consolidado</h3>
                    <p style={{ margin: 0 }}>Parabéns! Todas as missões iniciais foram concluídas. Sua cidade está pronta para dominar a Grécia!</p>
                  </div>
                );
              }

              const m = MISSOES[indexAtiva];
              const concluida = m.verificarConclusao(estadoCompleto);

              return (
                <div key={m.id} style={{
                  background: concluida ? 'rgba(212, 175, 55, 0.2)' : '#fff8e1',
                  border: `2px solid ${concluida ? '#D4AF37' : '#6d4c41'}`,
                  borderRadius: '10px',
                  padding: '15px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  transition: 'all 0.3s'
                }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: '0 0 5px 0', color: '#3e2723', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {m.titulo}
                      {concluida && <span style={{ color: '#D4AF37', fontSize: '0.8rem', background: '#3e2723', padding: '2px 8px', borderRadius: '12px' }}>PRONTA PARA COLETAR</span>}
                    </h3>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: '#5d4037' }}>{m.descricao}</p>
                    {renderizarRecompensas(m.recompensa)}
                  </div>
                  
                  <div style={{ marginLeft: '20px' }}>
                    {concluida ? (
                      <button 
                        onClick={() => handleColetar(m.id, m.recompensa)}
                        style={{ padding: '10px 25px', borderRadius: '6px', background: '#4CAF50', color: '#fff', border: '1px solid #2E7D32', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 4px 6px rgba(0,0,0,0.2)', fontSize: '1rem', transition: 'transform 0.1s' }}
                        onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
                        onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                      >
                        Coletar
                      </button>
                    ) : (
                      <button disabled style={{ padding: '10px 20px', borderRadius: '6px', background: '#d7ccc8', color: '#8d6e63', border: '1px solid #bcaaa4', fontWeight: 'bold' }}>
                        Em Progresso
                      </button>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>

        </div>
      </div>
    </div>
  );
}
