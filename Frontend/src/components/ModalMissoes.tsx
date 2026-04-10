// ============================================================
// MODAL MISSÕES — Agora com aba de Missões Diárias
// ============================================================
"use client";

import React, { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import { MISSOES } from '@/lib/missoes';
import { useGameStore } from '@/store/gameStore';
import { useMotorJogo } from '@/hooks/useMotorJogo';
import { useToast } from './ToastProvider';

export const ModalMissoes = React.memo(function ModalMissoes({ aberto, aoFechar }: { aberto: boolean; aoFechar: () => void }) {
  const { mostrarToast } = useToast();
  const { coletarRecompensaMissao } = useMotorJogo();
  const edificios = useGameStore(s => s.edificios);
  const unidades = useGameStore(s => s.unidades);
  const missoesColetadas = useGameStore(s => s.missoesColetadas);
  const estadoCompleto = useGameStore(s => s);

  // Estado das missões diárias
  const [abaAtiva, setAbaAtiva] = useState<'normais' | 'diarias'>('normais');
  const [missoesDiarias, setMissoesDiarias] = useState<any[]>([]);
  const [carregandoDiarias, setCarregandoDiarias] = useState(false);

  const fetchDiarias = useCallback(async () => {
    setCarregandoDiarias(true);
    try {
      const res = await fetch('/api/game/missoes-diarias');
      if (!res.ok) throw new Error('Erro');
      const data = await res.json();
      setMissoesDiarias(data.missoes || []);
    } catch {
      // silent
    } finally {
      setCarregandoDiarias(false);
    }
  }, []);

  const coletarDiaria = async (id: string) => {
    try {
      const res = await fetch('/api/game/missoes-diarias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ missaoId: id }),
      });
      if (res.ok) {
        const data = await res.json();
        mostrarToast('Missão diária coletada!', 'sucesso');
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('recurso-ganho', { detail: data.recompensa }));
        }
        fetchDiarias();
      } else {
        const err = await res.json();
        mostrarToast(err.erro || 'Erro ao coletar', 'erro');
      }
    } catch {
      mostrarToast('Erro ao coletar recompensa', 'erro');
    }
  };

  useEffect(() => {
    const escListener = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && aberto) aoFechar();
    };
    window.addEventListener('keydown', escListener);
    return () => window.removeEventListener('keydown', escListener);
  }, [aberto, aoFechar]);

  useEffect(() => {
    if (aberto && abaAtiva === 'diarias') fetchDiarias();
  }, [aberto, abaAtiva, fetchDiarias]);

  if (!aberto) return null;

  const renderizarRecompensas = (recompensa: { madeira?: number; pedra?: number; prata?: number; favor?: number }) => {
    return (
      <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
        {recompensa.madeira && (
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.9rem', color: '#8b4513' }}>
            <Image src="/icones/icone_madeira.png" width={16} height={16} alt="Madeira" /> +{recompensa.madeira}
          </span>
        )}
        {recompensa.pedra && (
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.9rem', color: '#555' }}>
            <Image src="/icones/icone_pedra.png" width={16} height={16} alt="Pedra" /> +{recompensa.pedra}
          </span>
        )}
        {recompensa.prata && (
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.9rem', color: '#708090' }}>
            <Image src="/icones/icone_prata.png" width={16} height={16} alt="Prata" /> +{recompensa.prata}
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

  const handleColetar = async (id: string, recom: any) => {
    const res = await coletarRecompensaMissao(id, recom);
    if (res.sucesso) {
      mostrarToast('Recompensa coletada com sucesso!', 'sucesso');
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('recurso-ganho', { detail: recom }));
      }
    } else {
      mostrarToast(res.motivo || 'Erro ao coletar', 'erro');
    }
  };

  const corDificuldade = { facil: '#4ade80', medio: '#fbbf24', dificil: '#f87171' };

  return (
    <div id="modal-overlay" onClick={(e) => e.target === e.currentTarget && aoFechar()}>
      <div id="modal-container" className="senado-theme" style={{ width: '800px' }}>
        <div id="modal-header">
          <h2 id="modal-title">📜 Missões</h2>
          <button id="close-modal" onClick={aoFechar}>&times;</button>
        </div>
        <div id="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>

          {/* Abas */}
          <div style={{ display: 'flex', gap: '0', borderBottom: '2px solid #e0cda7' }}>
            <button
              onClick={() => setAbaAtiva('normais')}
              style={{
                flex: 1, padding: '10px', border: 'none', cursor: 'pointer',
                background: abaAtiva === 'normais' ? 'rgba(109,76,65,0.15)' : 'transparent',
                color: abaAtiva === 'normais' ? '#6d4c41' : '#8d6e63',
                fontWeight: abaAtiva === 'normais' ? 'bold' : 'normal',
                borderBottom: abaAtiva === 'normais' ? '2px solid #6d4c41' : '2px solid transparent',
                fontSize: '0.9rem',
              }}
            >
              Missões Principais
            </button>
            <button
              onClick={() => setAbaAtiva('diarias')}
              style={{
                flex: 1, padding: '10px', border: 'none', cursor: 'pointer',
                background: abaAtiva === 'diarias' ? 'rgba(109,76,65,0.15)' : 'transparent',
                color: abaAtiva === 'diarias' ? '#6d4c41' : '#8d6e63',
                fontWeight: abaAtiva === 'diarias' ? 'bold' : 'normal',
                borderBottom: abaAtiva === 'diarias' ? '2px solid #6d4c41' : '2px solid transparent',
                fontSize: '0.9rem',
              }}
            >
              Missões Diárias
            </button>
          </div>

          {abaAtiva === 'normais' && (
            <>
              <p style={{ marginBottom: '10px', fontSize: '1.05rem', color: '#5d4037' }}>
                Complete tarefas de infraestrutura e exército para garantir a prosperidade e ajuda divina no desenvolvimento inicial.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(1, 1fr)', gap: '15px' }}>
                {(() => {
                  const indexAtiva = MISSOES.findIndex(m => !missoesColetadas.includes(m.id));
                  if (indexAtiva === -1) {
                    return (
                      <div style={{ textAlign: 'center', padding: '40px', color: '#6d4c41', background: 'rgba(109,76,65,0.1)', borderRadius: '10px', border: '2px solid #6d4c41' }}>
                        <h3 style={{ margin: '0 0 10px 0' }}>🌟 Império Consolidado</h3>
                        <p style={{ margin: 0 }}>Parabéns! Todas as missões iniciais foram concluídas.</p>
                      </div>
                    );
                  }
                  const m = MISSOES[indexAtiva];
                  const concluida = m.verificarConclusao(estadoCompleto);
                  return (
                    <div key={m.id} style={{
                      background: concluida ? 'rgba(109,76,65,0.15)' : '#fff8e1',
                      border: `2px solid ${concluida ? '#6d4c41' : '#e0cda7'}`,
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
                          {concluida && <span style={{ color: '#fff8e1', fontSize: '0.8rem', background: '#6d4c41', padding: '2px 8px', borderRadius: '12px' }}>PRONTA</span>}
                        </h3>
                        <p style={{ margin: 0, fontSize: '0.9rem', color: '#5d4037' }}>{m.descricao}</p>
                        {renderizarRecompensas(m.recompensa)}
                      </div>
                      <div style={{ marginLeft: '20px' }}>
                        {concluida ? (
                          <button
                            onClick={() => handleColetar(m.id, m.recompensa)}
                            style={{ padding: '10px 25px', borderRadius: '6px', background: '#4CAF50', color: '#fff', border: '1px solid #2E7D32', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem' }}>
                            Coletar
                          </button>
                        ) : (
                          <button disabled style={{ padding: '10px 20px', borderRadius: '6px', background: '#e0cda7', color: '#8d6e63', border: '1px solid #d4c09d', fontWeight: 'bold' }}>
                            Em Progresso
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </>
          )}

          {abaAtiva === 'diarias' && (
            <>
              <p style={{ marginBottom: '10px', fontSize: '0.95rem', color: '#5d4037' }}>
                Missões que renovam a cada 24h. Complete todas para maximizar suas recompensas diárias!
              </p>
              {carregandoDiarias ? (
                <div style={{ textAlign: 'center', padding: '30px', color: '#8d6e63' }}>Carregando...</div>
              ) : missoesDiarias.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px', color: '#8d6e63' }}>Nenhuma missão disponível hoje.</div>
              ) : (
                <div style={{ display: 'grid', gap: '12px' }}>
                  {missoesDiarias.map((md) => {
                    const completa = md.completa && !md.coletada;
                    const jaColetada = md.coletada;
                    return (
                      <div key={md.id} style={{
                        background: jaColetada ? 'rgba(74, 222, 128, 0.1)' : completa ? 'rgba(109,76,65,0.15)' : '#fff8e1',
                        border: `1px solid ${jaColetada ? '#4ade80' : completa ? '#6d4c41' : '#e0cda7'}`,
                        borderRadius: '8px',
                        padding: '12px 15px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <h3 style={{ margin: 0, color: '#3e2723', fontSize: '1rem' }}>{md.titulo}</h3>
                            <span style={{
                              fontSize: '0.65rem', padding: '2px 8px', borderRadius: '12px',
                              color: '#fff', fontWeight: 'bold',
                              background: corDificuldade[md.dificuldade as keyof typeof corDificuldade] || '#bcaaa4',
                            }}>
                              {md.dificuldade.toUpperCase()}
                            </span>
                            {jaColetada && (
                              <span style={{ fontSize: '0.75rem', color: '#4ade80' }}>✓ Coletada</span>
                            )}
                          </div>
                          <p style={{ margin: '4px 0', fontSize: '0.85rem', color: '#5d4037' }}>{md.descricao}</p>
                          {renderizarRecompensas(md.recompensa)}
                        </div>
                        <div style={{ marginLeft: '15px' }}>
                          {jaColetada ? (
                            <span style={{ color: '#4ade80', fontWeight: 'bold', fontSize: '1.2rem' }}>✓</span>
                          ) : completa ? (
                            <button
                              onClick={() => coletarDiaria(md.id)}
                              style={{ padding: '8px 20px', borderRadius: '6px', background: '#6d4c41', color: '#fff8e1', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem' }}>
                              Coletar
                            </button>
                          ) : (
                            <button disabled style={{ padding: '8px 16px', borderRadius: '6px', background: '#e0cda7', color: '#8d6e63', border: '1px solid #d4c09d', fontWeight: 'bold', fontSize: '0.85rem' }}>
                              Em Progresso
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

        </div>
      </div>
    </div>
  );
});
