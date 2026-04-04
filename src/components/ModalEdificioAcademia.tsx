"use client";

import React from 'react';
import Image from 'next/image';
import { PESQUISAS, IdPesquisa } from '@/lib/pesquisas';

interface ModalEdificioAcademiaProps {
  nivelAcademia: number;
  prata: number;
  pesquisasConcluidas: IdPesquisa[];
  aoPesquisar: (id: IdPesquisa) => { sucesso: boolean; motivo?: string };
  aomostrarToast?: (msg: React.ReactNode, tipo?: 'sucesso' | 'erro' | 'info' | 'aviso', icone?: React.ReactNode) => void;
}

export function ModalEdificioAcademia({
  nivelAcademia,
  prata,
  pesquisasConcluidas,
  aoPesquisar,
  aomostrarToast
}: ModalEdificioAcademiaProps) {

  const handlePesquisar = (id: IdPesquisa) => {
    const resultado = aoPesquisar(id);
    if (resultado.sucesso) {
      const p = PESQUISAS[id];
      aomostrarToast?.(
        `${p.nome} pesquisada com sucesso!`, 
        'sucesso',
        <Image src={p.icone} alt={p.nome} width={24} height={24} style={{ borderRadius: '4px' }} />
      );
    } else {
      aomostrarToast?.(resultado.motivo ?? 'Erro ao pesquisar', 'erro');
    }
  };

  const categorias = [
    { nome: '🏛️ Economia', ids: ['ceramica', 'arado'] as IdPesquisa[] },
    { nome: '⚔️ Militar', ids: ['forja', 'metalurgia', 'escudo', 'estrategia'] as IdPesquisa[] },
    { nome: '🌊 Avançado', ids: ['navegacao', 'espionagem'] as IdPesquisa[] }
  ];

  return (
    <div style={{ color: '#e2d5b0', fontFamily: 'var(--font-body, Arial)', padding: '10px' }}>
      <div style={{
        background: 'linear-gradient(135deg, #0c1f38, #1a2d4a)',
        border: '1px solid #3a5a8a',
        borderRadius: '8px',
        padding: '12px 16px',
        marginBottom: '20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <span style={{ color: '#7eb3e8', fontSize: '0.95rem' }}>
          📚 Academia Nível <strong style={{ color: '#D4AF37' }}>{nivelAcademia}</strong>
        </span>
        <span style={{ color: '#c0c0c0', fontSize: '0.9rem' }}>
          🪙 Prata disponível: <strong style={{ color: '#d0d0e8' }}>{Math.floor(prata)}</strong>
        </span>
      </div>

      {nivelAcademia === 0 && (
        <div style={{
          textAlign: 'center', padding: '30px',
          color: '#8a8a8a', border: '1px dashed #444', borderRadius: '8px'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '12px' }}>📚</div>
          <p>Construa a Academia para desbloquear pesquisas.</p>
        </div>
      )}

      {nivelAcademia > 0 && categorias.map(cat => (
        <div key={cat.nome} style={{ marginBottom: '24px' }}>
          <h4 style={{
            color: '#D4AF37',
            borderBottom: '1px solid #3a3a5a',
            paddingBottom: '6px',
            marginBottom: '12px',
            fontSize: '1rem'
          }}>
            {cat.nome}
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {cat.ids.map(id => {
              const pesq = PESQUISAS[id];
              const concluida = pesquisasConcluidas.includes(id);
              const bloqueada = nivelAcademia < pesq.requisitoAcademia;
              const semPrata = !concluida && !bloqueada && prata < pesq.custo.prata;

              return (
                <div
                  key={id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    background: concluida
                      ? 'linear-gradient(135deg, #12301a, #1a4726)'
                      : bloqueada
                        ? 'rgba(255,255,255,0.02)'
                        : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${concluida ? '#2d6a4f' : bloqueada ? '#333' : '#3a5a8a'}`,
                    borderRadius: '8px',
                    padding: '12px 16px',
                    opacity: bloqueada ? 0.5 : 1,
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ flexShrink: 0, width: '48px', height: '48px', position: 'relative' }}>
                    <Image
                      src={pesq.icone}
                      alt={pesq.nome}
                      fill
                      sizes="48px"
                      style={{ objectFit: 'contain' }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                      <strong style={{ color: concluida ? '#52b788' : '#e2d5b0', fontSize: '0.95rem' }}>
                        {pesq.nome}
                      </strong>
                      {bloqueada && (
                        <small style={{ color: '#888' }}>
                          🔒 Academia Nv. {pesq.requisitoAcademia}
                        </small>
                      )}
                    </div>
                    <p style={{ margin: '4px 0 0', color: '#9aa0ac', fontSize: '0.83rem', lineHeight: 1.4 }}>
                      {pesq.descricao}
                    </p>
                  </div>
                  <div style={{ flexShrink: 0, textAlign: 'right' }}>
                    {concluida ? (
                      <span style={{
                        background: '#166534', color: '#4ade80',
                        borderRadius: '20px', padding: '4px 12px',
                        fontSize: '0.8rem', fontWeight: 700
                      }}>
                        ✓ Concluída
                      </span>
                    ) : (
                      <button
                        disabled={bloqueada || semPrata}
                        onClick={() => handlePesquisar(id)}
                        title={bloqueada ? `Requer Academia Nv.${pesq.requisitoAcademia}` : ''}
                        style={{
                          background: bloqueada || semPrata
                            ? 'rgba(255,255,255,0.05)'
                            : 'linear-gradient(135deg, #1e3a5f, #2563eb)',
                          border: `1px solid ${bloqueada || semPrata ? '#374151' : '#3b82f6'}`,
                          borderRadius: '6px',
                          color: bloqueada || semPrata ? '#555' : '#fff',
                          padding: '6px 14px',
                          cursor: bloqueada || semPrata ? 'not-allowed' : 'pointer',
                          fontSize: '0.82rem',
                          fontWeight: 700,
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '2px',
                          minWidth: '80px',
                          transition: 'all 0.2s'
                        }}
                      >
                        <span style={{ color: semPrata ? '#ef4444' : 'inherit' }}>
                          🪙 {pesq.custo.prata}
                        </span>
                        <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>Pesquisar</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
