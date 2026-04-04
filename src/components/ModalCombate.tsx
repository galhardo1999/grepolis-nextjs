"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { UNIDADES, IdUnidade } from '@/lib/unidades';
import { ResultadoBatalha } from '@/lib/combate';

import { ALDEIAS_BARBARAS } from '@/lib/aldeias';

interface ModalCombateProps {
  unidades: Record<string, number>;
  aoAtacar: (idAldeia: string, exercito: Record<string, number>) => ResultadoBatalha | null;
  aomostrarToast?: (msg: React.ReactNode, tipo?: 'sucesso' | 'erro' | 'info' | 'aviso', icone?: React.ReactNode) => void;
}

export function ModalCombate({ unidades, aoAtacar, aomostrarToast }: ModalCombateProps) {
  const [aldeiaSelecionada, setAldeiaSelecionada] = useState<string | null>(null);
  const [exercitoEnviado, setExercitoEnviado] = useState<Record<string, number>>({});
  const [ultimoRelatorio, setUltimoRelatorio] = useState<ResultadoBatalha | null>(null);
  const [carregando, setCarregando] = useState(false);

  const ids = Object.keys(UNIDADES) as IdUnidade[];

  const alterarQtd = (id: IdUnidade, valor: number) => {
    const max = unidades[id] || 0;
    const qtd = Math.max(0, Math.min(max, valor));
    setExercitoEnviado(prev => ({ ...prev, [id]: qtd }));
  };

  const totalEnviado = Object.values(exercitoEnviado).reduce((a, b) => a + b, 0);

  const handleAtacar = () => {
    if (!aldeiaSelecionada) return;
    if (totalEnviado === 0) {
      aomostrarToast?.('Selecione ao menos uma unidade!', 'aviso', '⚔️');
      return;
    }
    setCarregando(true);
    setTimeout(() => {
      const resultado = aoAtacar(aldeiaSelecionada, exercitoEnviado);
      setUltimoRelatorio(resultado);
      setCarregando(false);
      if (resultado?.sucesso) {
        const { madeira, pedra, prata } = resultado.recursosRoubados;
        aomostrarToast?.(
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            Vitória! Saqueados: 
            <span style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>{madeira} <Image src="/icon_wood.png" width={16} height={16} alt="madeira" /></span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>{pedra} <Image src="/icon_stone.png" width={16} height={16} alt="pedra" /></span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>{prata} <Image src="/icon_silver.png" width={16} height={16} alt="prata" /></span>
          </div>,
          'sucesso', '⚔️'
        );
      } else {
        aomostrarToast?.('Derrota! Suas tropas recuaram.', 'erro', '💀');
      }
      setExercitoEnviado({});
    }, 800);
  };

  return (
    <div style={{ color: '#e2d5b0', fontFamily: 'var(--font-body, Arial)' }}>
      <div style={{
        background: 'linear-gradient(135deg, #1a0a0a, #2d1010)',
        border: '1px solid #7f1d1d',
        borderRadius: '8px',
        padding: '14px 16px',
        marginBottom: '20px'
      }}>
        <h4 style={{ color: '#ef4444', margin: '0 0 6px', fontSize: '1rem' }}>⚔️ Saquear Aldeias Bárbaras</h4>
        <p style={{ color: '#9aa0ac', margin: 0, fontSize: '0.85rem' }}>
          Selecione uma aldeia e depois envie suas tropas para conquistá-la e roubar recursos. Cuidado, tropas serão perdidas se a força for insuficiente!
        </p>
      </div>

      {/* Lista de Aldeias */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
        {ALDEIAS_BARBARAS.map(aldeia => (
          <div key={aldeia.id}
               onClick={() => setAldeiaSelecionada(aldeia.id)}
               style={{
                 background: aldeiaSelecionada === aldeia.id ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                 border: `1px solid ${aldeiaSelecionada === aldeia.id ? '#ef4444' : '#333'}`,
                 borderRadius: '8px',
                 padding: '12px',
                 cursor: 'pointer',
                 display: 'flex',
                 justifyContent: 'space-between',
                 alignItems: 'center',
                 transition: 'all 0.2s'
               }}>
            <div>
              <h5 style={{ margin: '0 0 4px 0', fontSize: '1.05rem', color: aldeiaSelecionada === aldeia.id ? '#ef4444' : '#e2d5b0' }}>
                {aldeia.nome} (Nv. {aldeia.nivel})
              </h5>
              <div style={{ display: 'flex', gap: '12px', fontSize: '0.8rem', color: '#9aa0ac' }}>
                <span title="Bônus de recursos se saquear com sucesso" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  Loot Est.: 
                  <span style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>{aldeia.saque.madeira} <Image src="/icon_wood.png" alt="madeira" width={14} height={14} /></span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>{aldeia.saque.pedra} <Image src="/icon_stone.png" alt="pedra" width={14} height={14} /></span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>{aldeia.saque.prata} <Image src="/icon_silver.png" alt="prata" width={14} height={14} /></span>
                </span>
                <span title="Defensores da aldeia">
                  Defesa: {Object.entries(aldeia.defesa).map(([idU, qtd]) => {
                     const u = UNIDADES[idU as IdUnidade];
                     return `${qtd} ${u.nome}`;
                  }).join(', ')}
                </span>
              </div>
            </div>
            {aldeiaSelecionada === aldeia.id && (
              <span style={{ color: '#ef4444', fontWeight: 'bold' }}>✓ Selecionada</span>
            )}
          </div>
        ))}
      </div>

      {/* Seleção de unidades - só aparece se tiver aldeia selecionada */}
      {aldeiaSelecionada && (
        <>
          <div style={{
            borderTop: '1px solid #333',
            paddingTop: '20px',
            marginBottom: '20px'
          }}>
            <h5 style={{ margin: '0 0 10px', color: '#e2d5b0' }}>Montar Exército para Saque</h5>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px' }}>
              {ids.map(id => {
          const u = UNIDADES[id];
          const max = unidades[id] || 0;
          const enviado = exercitoEnviado[id] || 0;

          return (
            <div
              key={id}
              style={{
                background: enviado > 0 ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${enviado > 0 ? '#7f1d1d' : '#2a2a3a'}`,
                borderRadius: '8px',
                padding: '10px',
                opacity: max === 0 ? 0.4 : 1
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <div style={{ position: 'relative', width: 40, height: 40, flexShrink: 0 }}>
                  <Image src={u.retrato} alt={u.nome} fill style={{ objectFit: 'cover', borderRadius: '4px' }} />
                </div>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#e2d5b0' }}>{u.nome}</div>
                  <div style={{ fontSize: '0.75rem', color: '#666' }}>
                    ⚔️{u.ataque} 🛡️{u.defesa}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button
                  onClick={() => alterarQtd(id, enviado - 1)}
                  disabled={max === 0}
                  style={{ background: '#2a0a0a', border: '1px solid #7f1d1d', color: '#ef4444', width: 24, height: 24, borderRadius: 4, cursor: 'pointer', fontSize: '1rem', lineHeight: 1 }}
                >-</button>
                <input
                  type="number"
                  value={enviado}
                  min={0}
                  max={max}
                  disabled={max === 0}
                  onChange={e => alterarQtd(id, parseInt(e.target.value) || 0)}
                  style={{
                    flex: 1, textAlign: 'center', background: '#0d1117',
                    border: '1px solid #333', color: '#e2d5b0',
                    borderRadius: 4, padding: '2px 0', fontSize: '0.9rem'
                  }}
                />
                <button
                  onClick={() => alterarQtd(id, enviado + 1)}
                  disabled={max === 0 || enviado >= max}
                  style={{ background: '#0a2010', border: '1px solid #166534', color: '#4ade80', width: 24, height: 24, borderRadius: 4, cursor: 'pointer', fontSize: '1rem', lineHeight: 1 }}
                >+</button>
                <button
                  onClick={() => alterarQtd(id, max)}
                  disabled={max === 0}
                  title="Máximo"
                  style={{ background: '#0a1020', border: '1px solid #1e3a5f', color: '#60a5fa', padding: '2px 6px', borderRadius: 4, cursor: 'pointer', fontSize: '0.7rem' }}
                >MAX</button>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#555', marginTop: '4px' }}>
                Disponível: {max}
              </div>
            </div>
          );
        })}
            </div>
          </div>

          <button
            onClick={handleAtacar}
            disabled={carregando || totalEnviado === 0}
            style={{
              width: '100%',
              padding: '12px',
              background: totalEnviado > 0
                ? 'linear-gradient(135deg, #7f1d1d, #dc2626)'
                : 'rgba(255,255,255,0.05)',
              border: `2px solid ${totalEnviado > 0 ? '#ef4444' : '#333'}`,
              borderRadius: '8px',
              color: totalEnviado > 0 ? '#fff' : '#555',
              fontWeight: 700,
              fontSize: '1rem',
              cursor: totalEnviado > 0 ? 'pointer' : 'not-allowed',
              transition: 'all 0.3s',
              marginBottom: '20px'
            }}
          >
            {carregando ? '⚔️ Batalha em andamento...' : `⚔️ Atacar com ${totalEnviado} unidade${totalEnviado !== 1 ? 's' : ''}`}
          </button>
        </>
      )}

      {/* Relatório da última batalha */}
      {ultimoRelatorio && (
        <div style={{
          background: ultimoRelatorio.sucesso
            ? 'linear-gradient(135deg, #052e16, #064e3b)'
            : 'linear-gradient(135deg, #1c0606, #2d0a0a)',
          border: `1px solid ${ultimoRelatorio.sucesso ? '#166534' : '#7f1d1d'}`,
          borderRadius: '8px',
          padding: '16px'
        }}>
          <h4 style={{
            color: ultimoRelatorio.sucesso ? '#4ade80' : '#f87171',
            margin: '0 0 12px', fontSize: '1rem'
          }}>
            {ultimoRelatorio.sucesso ? '🏆 Relatório de Vitória' : '💀 Relatório de Derrota'}
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {ultimoRelatorio.relatorio.map((linha, i) => {
              if (linha.startsWith('💰 Saque:')) {
                return (
                  <div key={i} style={{ margin: 0, color: '#e2d5b0', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                    <span>💰 Saque:</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>{ultimoRelatorio.recursosRoubados.madeira} <Image src="/icon_wood.png" width={14} height={14} alt="madeira" /></span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>{ultimoRelatorio.recursosRoubados.pedra} <Image src="/icon_stone.png" width={14} height={14} alt="pedra" /></span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>{ultimoRelatorio.recursosRoubados.prata} <Image src="/icon_silver.png" width={14} height={14} alt="prata" /></span>
                  </div>
                );
              }
              return <p key={i} style={{ margin: 0, color: '#e2d5b0', fontSize: '0.88rem' }}>{linha}</p>
            })}
          </div>

          {Object.keys(ultimoRelatorio.baixasAtacante).some(k => ultimoRelatorio.baixasAtacante[k] > 0) && (
            <div style={{ marginTop: '12px', borderTop: '1px solid #333', paddingTop: '10px' }}>
              <p style={{ margin: '0 0 6px', color: '#888', fontSize: '0.82rem' }}>Perdas:</p>
              {Object.entries(ultimoRelatorio.baixasAtacante)
                .filter(([, b]) => b > 0)
                .map(([id, baixas]) => (
                  <span key={id} style={{ color: '#f87171', fontSize: '0.82rem', marginRight: '12px' }}>
                    -{baixas} {UNIDADES[id as IdUnidade].nome}
                  </span>
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
