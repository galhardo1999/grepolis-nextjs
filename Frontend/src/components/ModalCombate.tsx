"use client";

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { UNIDADES, IdUnidade } from '@/lib/unidades';
import { ResultadoBatalha } from '@/lib/combate';

import { ALDEIAS_BARBARAS } from '@/lib/aldeias';

interface ModalCombateProps {
  unidades: Record<string, number>;
  cooldownsAldeias: Record<string, number>;
  agora: number;
  aoAtacar: (idAldeia: string, exercito: Record<string, number>) => ResultadoBatalha | null;
  aoMostrarToast?: (msg: React.ReactNode, tipo?: 'sucesso' | 'erro' | 'info' | 'aviso', icone?: React.ReactNode) => void;
  nomeCidade: string;
}

export const ModalCombate = React.memo(function ModalCombate({ unidades, cooldownsAldeias, agora, aoAtacar, aoMostrarToast, nomeCidade }: ModalCombateProps) {
  const [aldeiaSelecionada, setAldeiaSelecionada] = useState<string | null>(null);
  const [exercitoEnviado, setExercitoEnviado] = useState<Record<string, number>>({});
  const [ultimoRelatorio, setUltimoRelatorio] = useState<ResultadoBatalha | null>(null);
  const [carregando, setCarregando] = useState(false);
  const ataqueTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup timeout ao desmontar
  useEffect(() => {
    return () => {
      if (ataqueTimeoutRef.current) clearTimeout(ataqueTimeoutRef.current);
    };
  }, []);

  const ids = Object.keys(UNIDADES) as IdUnidade[];

  const alterarQtd = (id: IdUnidade, valor: number) => {
    const max = unidades[id] || 0;
    const qtd = Math.max(0, Math.min(max, valor));
    setExercitoEnviado(prev => ({ ...prev, [id]: qtd }));
  };

  const totalEnviado = Object.values(exercitoEnviado).reduce((a, b) => a + b, 0);

  const formatarTempo = (ms: number) => {
    if (ms <= 0) return '00:00';
    const s = Math.floor(ms / 1000);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0) return `${h}h ${m}m ${sec}s`;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const handleAtacar = () => {
    if (!aldeiaSelecionada) return;
    if (totalEnviado === 0) {
      aoMostrarToast?.('Selecione ao menos uma unidade!', 'aviso', '⚔️');
      return;
    }
    setCarregando(true);

    // Limpar timeout anterior se existir
    if (ataqueTimeoutRef.current) clearTimeout(ataqueTimeoutRef.current);

    ataqueTimeoutRef.current = setTimeout(() => {
      const resultado = aoAtacar(aldeiaSelecionada, exercitoEnviado);
      setUltimoRelatorio(resultado);
      setCarregando(false);
      if (resultado?.sucesso) {
        const { madeira, pedra, prata } = resultado.recursosRoubados;
        aoMostrarToast?.(
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            Vitória! Saqueados:
            <span style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>{madeira} <Image src="/icones/icone_madeira.png" width={16} height={16} alt="madeira" /></span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>{pedra} <Image src="/icones/icone_pedra.png" width={16} height={16} alt="pedra" /></span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>{prata} <Image src="/icones/icone_prata.png" width={16} height={16} alt="prata" /></span>
          </div>,
          'sucesso', '⚔️'
        );
      } else {
        aoMostrarToast?.('Derrota! Suas tropas recuaram.', 'erro', '💀');
      }
      setExercitoEnviado({});
      ataqueTimeoutRef.current = null;
    }, 800);
  };

  return (
    <div style={{ color: '#3e2723', fontFamily: 'var(--font-body, Arial)' }}>
      {/* Renderização em abas/páginas: Lista vs Seleção */}
      {!aldeiaSelecionada ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
          {ALDEIAS_BARBARAS.map(aldeia => {
            const tempoFim = cooldownsAldeias[aldeia.id] || 0;
            const emCooldown = tempoFim > agora;
            const tempoRestante = tempoFim - agora;

            return (
              <div key={aldeia.id}
                onClick={() => !emCooldown && setAldeiaSelecionada(aldeia.id)}
                style={{
                  background: emCooldown ? 'rgba(0, 0, 0, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                  border: `1px solid ${emCooldown ? '#999' : '#c2a77a'}`,
                  borderRadius: '8px',
                  padding: '12px',
                  cursor: emCooldown ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  transition: 'all 0.2s',
                  opacity: emCooldown ? 0.7 : 1,
                  position: 'relative'
                }}
                onMouseEnter={(e) => !emCooldown && (e.currentTarget.style.borderColor = '#8b0000', e.currentTarget.style.background = 'rgba(139, 0, 0, 0.05)')}
                onMouseLeave={(e) => !emCooldown && (e.currentTarget.style.borderColor = '#c2a77a', e.currentTarget.style.background = 'rgba(0, 0, 0, 0.03)')}
              >
                {emCooldown && (
                  <div style={{
                    position: 'absolute', top: '10px', right: '10px',
                    background: '#3e2723', color: '#fff', padding: '2px 8px', borderRadius: '4px',
                    fontSize: '0.8rem', fontWeight: 'bold', zIndex: 2
                  }}>
                    ⏳ {formatarTempo(tempoRestante)}
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <div style={{ position: 'relative', width: '64px', height: '64px', flexShrink: 0, filter: emCooldown ? 'grayscale(1)' : 'none' }}>
                    <Image src={aldeia.imagem} alt={aldeia.nome} fill style={{ objectFit: 'cover', borderRadius: '8px', border: '1px solid #c2a77a' }} />
                  </div>
                  <div>
                    <h5 style={{ margin: '0 0 4px 0', fontSize: '1.05rem', color: emCooldown ? '#666' : '#3e2723' }}>
                      {aldeia.nome} (Nv. {aldeia.nivel})
                    </h5>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                      <div title="Bônus de recursos se saquear com sucesso" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: '#5d4037' }}>
                        <strong>Loot Est.:</strong>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>{aldeia.saque.madeira} <Image src="/icones/icone_madeira.png" alt="madeira" width={14} height={14} /></span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>{aldeia.saque.pedra} <Image src="/icones/icone_pedra.png" alt="pedra" width={14} height={14} /></span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>{aldeia.saque.prata} <Image src="/icones/icone_prata.png" alt="prata" width={14} height={14} /></span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <strong style={{ fontSize: '0.85rem', color: '#5d4037' }}>Defesa:</strong>
                        {Object.entries(aldeia.defesa).map(([idU, qtd]) => {
                          const u = UNIDADES[idU as IdUnidade];
                          if (!u) return null;
                          return (
                            <div key={idU} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(139, 0, 0, 0.05)', border: '1px solid #c2a77a', borderRadius: '4px', padding: '2px 6px' }} title={u.nome}>
                              <Image src={u.retrato} alt={u.nome} width={20} height={20} style={{ borderRadius: '2px' }} />
                              <span style={{ fontWeight: 700, color: '#8b0000', fontSize: '0.85rem' }}>{qtd}</span>
                              <span style={{ color: '#5d4037', fontSize: '0.8rem', marginLeft: '2px' }}>{u.nome}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <>
          {!ultimoRelatorio && (() => {
            const inf = ALDEIAS_BARBARAS.find(a => a.id === aldeiaSelecionada)!;
            return (
              <div style={{ marginBottom: '20px' }}>
                <button
                  onClick={() => { setAldeiaSelecionada(null); setUltimoRelatorio(null); setExercitoEnviado({}); }}
                  style={{ background: 'transparent', border: 'none', color: '#5d4037', cursor: 'pointer', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1rem', padding: 0 }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#8b0000'}
                  onMouseLeave={(e) => e.currentTarget.style.color = '#5d4037'}
                >
                  ← Voltar para seleção de aldeias
                </button>

                <div style={{ background: 'rgba(139, 0, 0, 0.05)', border: '1px solid #8b0000', borderRadius: '8px', padding: '12px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <div style={{ position: 'relative', width: '64px', height: '64px', flexShrink: 0 }}>
                    <Image src={inf.imagem} alt={inf.nome} fill style={{ objectFit: 'cover', borderRadius: '8px', border: '1px solid #c2a77a' }} />
                  </div>
                  <div>
                    <h5 style={{ margin: '0 0 4px 0', fontSize: '1.05rem', color: '#8b0000' }}>
                      {inf.nome} (Nv. {inf.nivel})
                    </h5>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
                      <div title="Bônus de recursos se saquear com sucesso" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', color: '#5d4037' }}>
                        <strong>Loot Est.:</strong>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>{inf.saque.madeira} <Image src="/icones/icone_madeira.png" alt="madeira" width={14} height={14} /></span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>{inf.saque.pedra} <Image src="/icones/icone_pedra.png" alt="pedra" width={14} height={14} /></span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>{inf.saque.prata} <Image src="/icones/icone_prata.png" alt="prata" width={14} height={14} /></span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <strong style={{ fontSize: '0.9rem', color: '#5d4037' }}>Defesa:</strong>
                        {Object.entries(inf.defesa).map(([idU, qtd]) => {
                          const u = UNIDADES[idU as IdUnidade];
                          if (!u) return null;
                          return (
                            <div key={idU} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(139, 0, 0, 0.05)', border: '1px solid #c2a77a', borderRadius: '4px', padding: '2px 6px' }} title={u.nome}>
                              <Image src={u.retrato} alt={u.nome} width={20} height={20} style={{ borderRadius: '2px' }} />
                              <span style={{ fontWeight: 700, color: '#8b0000', fontSize: '0.85rem' }}>{qtd}</span>
                              <span style={{ color: '#5d4037', fontSize: '0.8rem', marginLeft: '2px' }}>{u.nome}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
          {!ultimoRelatorio && (
            <>
              <div style={{
                borderTop: '1px solid #c2a77a',
                paddingTop: '20px',
                marginBottom: '20px'
              }}>
                <h5 style={{ margin: '0 0 10px', color: '#3e2723' }}>Montar Exército para Saque</h5>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'flex-start' }}>
                  {ids
                    .filter(id => UNIDADES[id].tipo === 'terrestre')
                    .map(id => {
                      const u = UNIDADES[id];
                      const max = unidades[id] || 0;
                      const enviado = exercitoEnviado[id] || 0;

                      return (
                        <div
                          key={id}
                          style={{
                            width: '100px',
                            background: enviado > 0 ? 'rgba(139, 0, 0, 0.05)' : 'rgba(0, 0, 0, 0.02)',
                            border: `1px solid ${enviado > 0 ? '#8b0000' : (max > 0 ? '#c2a77a' : 'transparent')}`,
                            borderRadius: '8px',
                            padding: '8px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            opacity: max === 0 ? 0.5 : 1,
                            transition: 'all 0.2s',
                            filter: max === 0 ? 'grayscale(80%)' : 'none'
                          }}
                        >
                          <div style={{ position: 'relative', width: 50, height: 50, marginBottom: '6px' }}>
                            <Image src={u.retrato} alt={u.nome} fill style={{ objectFit: 'cover', borderRadius: '4px', border: '1px solid #c2a77a' }} />
                          </div>

                          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#3e2723', textAlign: 'center', lineHeight: 1.1, minHeight: '1.65rem', display: 'flex', alignItems: 'center' }}>
                            {u.nome}
                          </div>
                          <div style={{ fontSize: '0.65rem', color: '#5d4037', marginBottom: '8px', fontWeight: max > 0 ? 'bold' : 'normal' }}>
                            Disp: {max}
                          </div>

                          <div style={{ display: 'flex', width: '100%', gap: '4px', height: '24px' }}>
                            <input
                              type="number"
                              value={enviado === 0 ? '' : enviado}
                              min={0}
                              max={max}
                              disabled={max === 0}
                              onChange={e => alterarQtd(id, parseInt(e.target.value) || 0)}
                              placeholder="0"
                              style={{
                                flex: 1, width: '100%', textAlign: 'center', background: 'rgba(255,255,255,0.6)',
                                border: '1px solid #c2a77a', color: '#3e2723', borderRadius: '4px', padding: 0, fontSize: '0.8rem',
                                outline: 'none'
                              }}
                            />
                            <button
                              onClick={() => alterarQtd(id, max)}
                              disabled={max === 0}
                              title="Máximo"
                              style={{
                                background: max > 0 ? '#8b0000' : '#888',
                                border: 'none',
                                color: '#f4ead5',
                                padding: '0 4px',
                                borderRadius: '4px',
                                cursor: max > 0 ? 'pointer' : 'not-allowed',
                                fontSize: '0.65rem',
                                fontWeight: 'bold'
                              }}
                            >MAX</button>
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
                    ? 'linear-gradient(135deg, #8b0000, #b71c1c)'
                    : 'rgba(0, 0, 0, 0.05)',
                  border: `1px solid ${totalEnviado > 0 ? '#8b0000' : '#c2a77a'}`,
                  borderRadius: '8px',
                  color: totalEnviado > 0 ? '#f4ead5' : '#888',
                  fontWeight: 700,
                  fontSize: '1.05rem',
                  cursor: totalEnviado > 0 ? 'pointer' : 'not-allowed',
                  transition: 'all 0.3s',
                  marginBottom: '20px'
                }}
              >
                {carregando ? '⚔️ Tropas marchando...' : `⚔️ Atacar com ${totalEnviado} unidade${totalEnviado !== 1 ? 's' : ''}`}
              </button>
            </>
          )}
        </>
      )}

      {/* Relatório da última batalha (Estilo Grepolis) */}
      {ultimoRelatorio && (
        <div style={{
          position: 'relative',
          padding: '30px 20px',
          backgroundImage: 'url("/fundos/papiro_relatorio.png")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          borderRadius: '4px',
          boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
          border: '1px solid #8b7355',
          marginTop: '20px',
          fontFamily: 'serif',
          color: '#3e2723'
        }}>
          {/* Header do Relatório */}
          <div style={{
            textAlign: 'center',
            marginBottom: '20px',
            fontSize: '0.9rem',
            borderBottom: '1px solid rgba(62, 39, 35, 0.2)',
            paddingBottom: '10px'
          }}>
            Você atacou <strong>{ALDEIAS_BARBARAS.find(a => a.id === aldeiaSelecionada)?.nome || 'Cidade independente'}</strong>.
            <span style={{ marginLeft: '10px', opacity: 0.8 }}>{new Date().toLocaleString('pt-BR')}</span>
          </div>

          {(() => {
            const infAldeia = ALDEIAS_BARBARAS.find(a => a.id === aldeiaSelecionada);
            const nomeAldeia = infAldeia?.nome || 'Bárbaros';

            // Dados das duas colunas (Esquerda = Vencedor, Direita = Derrotado)
            const vencedor = ultimoRelatorio.sucesso
              ? {
                nome: nomeCidade,
                exercito: ultimoRelatorio.exercitoAtacanteInicial,
                baixas: ultimoRelatorio.baixasAtacante,
                retrato: "/unidades/unidade_cavaleiro.png", // Retrato do Jogador
                coroa: "/icones/coroa_vencedor.png",
                label: "VENCEDOR",
                cor: "#2e7d32"
              }
              : {
                nome: nomeAldeia,
                exercito: ultimoRelatorio.exercitoDefensorInicial,
                baixas: ultimoRelatorio.baixasDefensor,
                retrato: infAldeia?.imagem || "/aldeias/aldeia-1.png", // Retrato da Aldeia X
                coroa: "/icones/coroa_vencedor.png",
                label: "VENCEDOR",
                cor: "#2e7d32"
              };

            const derrotado = !ultimoRelatorio.sucesso
              ? {
                nome: nomeCidade,
                exercito: ultimoRelatorio.exercitoAtacanteInicial,
                baixas: ultimoRelatorio.baixasAtacante,
                retrato: "/unidades/unidade_cavaleiro.png", // Retrato do Jogador
                coroa: "/icones/coroa_derrotado.png",
                label: "DERROTADO",
                cor: "#c62828"
              }
              : {
                nome: nomeAldeia,
                exercito: ultimoRelatorio.exercitoDefensorInicial,
                baixas: ultimoRelatorio.baixasDefensor,
                retrato: infAldeia?.imagem || "/aldeias/aldeia-1.png", // Retrato da Aldeia X
                coroa: "/icones/coroa_derrotado.png",
                label: "DERROTADO",
                cor: "#c62828"
              };

            return (
              <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'flex-start', gap: '20px' }}>
                {/* Lado Vencedor (Sempre na Esquerda) */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
                  <h3 style={{ margin: '0 0 10px', fontSize: '1.4rem', letterSpacing: '2px', color: vencedor.cor, fontWeight: 'bold', textTransform: 'uppercase' }}>
                    {vencedor.label}
                  </h3>
                  <div style={{ position: 'relative', width: '120px', height: '120px', marginBottom: '15px' }}>
                    <div style={{ width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden', border: '3px solid #8b7355', boxShadow: 'inset 0 0 10px rgba(0,0,0,0.5)', backgroundColor: '#ccc', position: 'relative', zIndex: 1 }}>
                      <Image src={vencedor.retrato} alt={vencedor.label} fill style={{ objectFit: 'cover' }} />
                    </div>
                    <div style={{ position: 'absolute', top: '50%', left: '50%', width: '160%', height: '160%', transform: 'translate(-50%, -50%)', zIndex: 2, backgroundImage: `url(${vencedor.coroa})`, backgroundSize: 'contain', backgroundRepeat: 'no-repeat', backgroundPosition: 'center', mixBlendMode: 'multiply', pointerEvents: 'none' }} />
                  </div>
                  <div style={{ textAlign: 'center', fontSize: '1rem', fontWeight: 'bold', marginBottom: '15px', color: '#5d4037', textShadow: '0 1px 1px rgba(255,255,255,0.5)' }}>
                    {vencedor.nome}
                  </div>
                  <div style={{ width: '100%', display: 'flex', flexDirection: 'column', border: '1px solid rgba(62,39,35,0.2)', background: 'rgba(255,255,255,0.1)', borderRadius: '2px' }}>
                    <div style={{ display: 'flex', borderBottom: '1px solid rgba(62,39,35,0.2)', background: 'rgba(0,0,0,0.03)' }}>
                      {Object.keys(vencedor.exercito).map(id => {
                        const u = UNIDADES[id as IdUnidade];
                        return (
                          <div key={id} style={{ flex: 1, borderRight: '1px solid rgba(62,39,35,0.1)', padding: '4px', display: 'flex', justifyContent: 'center' }}>
                            {u ? <Image src={u.retrato} alt={id} width={28} height={28} style={{ borderRadius: '2px', border: '1px solid rgba(0,0,0,0.1)' }} /> : <span>?</span>}
                          </div>
                        );
                      })}
                    </div>
                    <div style={{ display: 'flex' }}>
                      {Object.entries(vencedor.exercito).map(([id, qtd]) => (
                        <div key={id} style={{ flex: 1, borderRight: '1px solid rgba(62,39,35,0.1)', padding: '6px 4px', textAlign: 'center', fontSize: '0.9rem' }}>
                          <div style={{ fontWeight: 'bold', color: '#3e2723' }}>{qtd}</div>
                          {vencedor.baixas[id] > 0 && (
                            <div style={{ color: '#c62828', fontSize: '0.8rem', fontWeight: 'bold' }}>-{vencedor.baixas[id]}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div style={{ width: '1px', alignSelf: 'stretch', background: 'rgba(62,39,35,0.1)' }} />

                {/* Lado Derrotado (Sempre na Direita) */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
                  <h3 style={{ margin: '0 0 10px', fontSize: '1.4rem', letterSpacing: '2px', color: derrotado.cor, fontWeight: 'bold', textTransform: 'uppercase' }}>
                    {derrotado.label}
                  </h3>
                  <div style={{ position: 'relative', width: '120px', height: '120px', marginBottom: '15px' }}>
                    <div style={{ width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden', border: '3px solid #8b7355', boxShadow: 'inset 0 0 10px rgba(0,0,0,0.5)', backgroundColor: '#ccc', position: 'relative', zIndex: 1 }}>
                      <Image src={derrotado.retrato} alt={derrotado.label} fill style={{ objectFit: 'cover' }} />
                    </div>
                    <div style={{ position: 'absolute', top: '50%', left: '50%', width: '160%', height: '160%', transform: 'translate(-50%, -50%)', zIndex: 2, backgroundImage: `url(${derrotado.coroa})`, backgroundSize: 'contain', backgroundRepeat: 'no-repeat', backgroundPosition: 'center', mixBlendMode: 'multiply', pointerEvents: 'none' }} />
                  </div>
                  <div style={{ textAlign: 'center', fontSize: '1rem', fontWeight: 'bold', marginBottom: '15px', color: '#5d4037', textShadow: '0 1px 1px rgba(255,255,255,0.5)' }}>
                    {derrotado.nome}
                  </div>
                  <div style={{ width: '100%', display: 'flex', flexDirection: 'column', border: '1px solid rgba(62,39,35,0.2)', background: 'rgba(255,255,255,0.1)', borderRadius: '2px' }}>
                    <div style={{ display: 'flex', borderBottom: '1px solid rgba(62,39,35,0.2)', background: 'rgba(0,0,0,0.03)' }}>
                      {Object.keys(derrotado.exercito).map(id => {
                        const u = UNIDADES[id as IdUnidade];
                        return (
                          <div key={id} style={{ flex: 1, borderRight: '1px solid rgba(62,39,35,0.1)', padding: '4px', display: 'flex', justifyContent: 'center' }}>
                            {u ? <Image src={u.retrato} alt={id} width={28} height={28} style={{ borderRadius: '2px', border: '1px solid rgba(0,0,0,0.1)' }} /> : <span>?</span>}
                          </div>
                        );
                      })}
                    </div>
                    <div style={{ display: 'flex' }}>
                      {Object.entries(derrotado.exercito).map(([id, qtd]) => (
                        <div key={id} style={{ flex: 1, borderRight: '1px solid rgba(62,39,35,0.1)', padding: '6px 4px', textAlign: 'center', fontSize: '0.9rem' }}>
                          <div style={{ fontWeight: 'bold', color: '#3e2723' }}>{qtd}</div>
                          {derrotado.baixas[id] > 0 && (
                            <div style={{ color: '#c62828', fontSize: '0.8rem', fontWeight: 'bold' }}>-{derrotado.baixas[id]}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Rodapé - Recursos e População */}
          <div style={{
            marginTop: '30px',
            background: 'rgba(0,0,0,0.05)',
            padding: '12px',
            borderRadius: '4px',
            display: 'flex',
            justifyContent: 'center',
            gap: '20px',
            alignItems: 'center',
            fontSize: '0.9rem',
            border: '1px solid rgba(0,0,0,0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <strong>Recursos pilhados:</strong>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                {ultimoRelatorio?.recursosRoubados.madeira} <Image src="/icones/icone_madeira.png" width={20} height={20} alt="madeira" />
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                {ultimoRelatorio?.recursosRoubados.pedra} <Image src="/icones/icone_pedra.png" width={20} height={20} alt="pedra" />
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                {ultimoRelatorio?.recursosRoubados.prata} <Image src="/icones/icone_prata.png" width={20} height={20} alt="prata" />
              </span>
            </div>

            <div style={{ flex: 1 }} />

            <div style={{ display: 'flex', gap: '15px' }}>
              <span>População perdida: <strong style={{ color: '#c62828' }}>
                {Object.values(ultimoRelatorio?.baixasAtacante || {}).reduce((total, b, i) => {
                  const keys = Object.keys(ultimoRelatorio?.baixasAtacante || {});
                  const id = keys[i];
                  const u = UNIDADES[id as IdUnidade];
                  return total + (b * (u?.custos.populacao || 0));
                }, 0)}
              </strong></span>
            </div>
          </div>

          {/* Botão Fechar Relatório */}
          <button
            onClick={() => setUltimoRelatorio(null)}
            style={{
              position: 'absolute',
              top: '10px',
              right: '10px',
              background: 'transparent',
              border: 'none',
              fontSize: '1.2rem',
              cursor: 'pointer',
              opacity: 0.5
            }}
          >✕</button>
        </div>
      )}


    </div>
  );
});
