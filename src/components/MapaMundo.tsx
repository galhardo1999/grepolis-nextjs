// ============================================================
// MAPA DO MUNDO — Visualização interativa do mapa
// ============================================================
"use client";

import React, { useState, useCallback, useRef } from 'react';
import Image from 'next/image';

interface EntidadeMapa {
  cidadeId?: string;
  id?: string;
  nomeCidade?: string;
  username?: string;
  nome?: string;
  mapaX: number;
  mapaY: number;
  ilha: number;
  pontos?: number;
  nivel?: number;
  aliacaTag?: string | null;
  aliacaNome?: string | null;
  nivelMaravilha?: number;
  eBarbaro: boolean;
  eJogador?: boolean;
}

interface Props {
  aberto: boolean;
  aoFechar: () => void;
  aoClicarCidade: (entidade: EntidadeMapa) => void;
  aliacaTag?: string | null;
}

type FiltroMapa = 'todos' | 'aliados' | 'inimigos' | 'sem-alianca';

// Cores de aliança com base no hash da tag
function getCorAlianca(tag: string | null | undefined): string {
  if (!tag) return '#444';
  let hash = 0;
  for (let i = 0; i < tag.length; i++) hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  const cores = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c', '#e67e22', '#ff69b4', '#00bcd4', '#8bc34a'];
  return cores[Math.abs(hash) % cores.length];
}

export function MapaMundo({ aberto, aoFechar, aoClicarCidade, aliacaTag }: Props) {
  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [entidades, setEntidades] = useState<EntidadeMapa[]>([]);
  const [ilhaAtiva, setIlhaAtiva] = useState<number | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const [filtro, setFiltro] = useState<FiltroMapa>('todos');
  const [tooltip, setTooltip] = useState<EntidadeMapa | null>(null);

  const carregarMapa = useCallback(async (ilha?: number) => {
    setCarregando(true);
    setErro(null);
    try {
      const params = ilha ? `?ilha=${ilha}` : '';
      const res = await fetch(`/api/game/mapa${params}`);
      if (!res.ok) throw new Error('Erro ao carregar mapa');
      const data = await res.json();
      const todas: EntidadeMapa[] = [
        ...(data.cidades || []),
        ...(data.aldeias || []).map((a: Record<string, unknown>) => ({ ...a, eBarbaro: true })),
      ];
      setEntidades(todas);
      setIlhaAtiva(ilha || null);
    } catch {
      setErro('Erro ao carregar mapa. Tente novamente.');
    }
    setCarregando(false);
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    dragStart.current = { x: e.clientX - panX, y: e.clientY - panY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return;
    setPanX(e.clientX - dragStart.current.x);
    setPanY(e.clientY - dragStart.current.y);
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  if (!aberto) return null;

  return (
    <div id="modal-overlay" onClick={(e) => e.target === e.currentTarget && aoFechar()}>
      <div id="modal-container" className="senado-theme" style={{ width: '900px', height: '650px' }}>
        <div id="modal-header">
          <h2 id="modal-title">🗺️ Mapa do Mundo</h2>
          <button id="close-modal" onClick={aoFechar}>&times;</button>
        </div>
        <div id="modal-body" style={{ padding: '10px', height: 'calc(100% - 60px)' }}>
          {/* Toolbar */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => carregarMapa()}
              style={{
                padding: '6px 14px', background: '#6d4c41', color: '#fff8e1',
                border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold',
              }}
            >
              Ver Todas
            </button>
            <div style={{ display: 'flex', gap: '4px' }}>
              {[0, 1, 2, 3].map(i => (
                <button
                  key={i}
                  onClick={() => carregarMapa(i)}
                  style={{
                    padding: '4px 10px', background: ilhaAtiva === i ? '#6d4c41' : '#eedcba',
                    color: ilhaAtiva === i ? '#fff8e1' : '#6d4c41',
                    border: '1px solid #6d4c41', borderRadius: '4px', cursor: 'pointer',
                    fontSize: '0.8rem',
                  }}
                >
                  Ilha {i}
                </button>
              ))}
            </div>

            {/* Filtros */}
            <div style={{ display: 'flex', gap: '4px', borderLeft: '1px solid #e0cda7', paddingLeft: '10px', marginLeft: '5px' }}>
              {([
                ['todos', 'Todos'],
                ['aliados', 'Aliados'],
                ['inimigos', 'Inimigos'],
                ['sem-alianca', 'Sem Alianca'],
              ] as const).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setFiltro(key)}
                  style={{
                    padding: '4px 10px', background: filtro === key ? 'rgba(109,76,65,0.2)' : '#eedcba',
                    color: filtro === key ? '#6d4c41' : '#5d4037',
                    border: '1px solid #d4c09d', borderRadius: '4px', cursor: 'pointer',
                    fontSize: '0.75rem',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px', alignItems: 'center' }}>
              <button onClick={() => setZoom(z => Math.max(0.3, z - 0.2))}
                style={{ padding: '4px 10px', background: '#eedcba', color: '#6d4c41', border: '1px solid #6d4c41', borderRadius: '4px', cursor: 'pointer' }}>
                -
              </button>
              <span style={{ color: '#6d4c41', fontSize: '0.8rem' }}>{Math.round(zoom * 100)}%</span>
              <button onClick={() => setZoom(z => Math.min(3, z + 0.2))}
                style={{ padding: '4px 10px', background: '#eedcba', color: '#6d4c41', border: '1px solid #6d4c41', borderRadius: '4px', cursor: 'pointer' }}>
                +
              </button>
            </div>
          </div>

          {/* Map Area */}
          <div
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            style={{
              width: '100%',
              height: '500px',
              background: '#e6dcb8',
              borderRadius: '8px',
              overflow: 'hidden',
              cursor: isDragging.current ? 'grabbing' : 'grab',
              border: '1px solid #8b7355',
              position: 'relative',
            }}
          >
            {carregando && (
              <div style={{
                position: 'absolute', inset: 0, display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                background: 'rgba(230,220,184,0.8)', zIndex: 10,
                color: '#6d4c41', fontSize: '1.2rem',
              }}>
                Carregando mapa...
              </div>
            )}

            {erro && (
              <div style={{
                position: 'absolute', inset: 0, display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                background: 'rgba(230,220,184,0.8)', zIndex: 10,
                color: '#f87171', fontSize: '1rem',
              }}>
                {erro}
              </div>
            )}

            <div style={{
              transform: `translate(${panX}px, ${panY}px) scale(${zoom})`,
              transformOrigin: 'center center',
              transition: isDragging.current ? 'none' : 'transform 0.2s',
              width: '100%',
              height: '100%',
              position: 'relative',
            }}>
              {/* Grid */}
              <svg
                width="100%"
                height="100%"
                style={{ position: 'absolute', top: 0, left: 0 }}
              >
                {/* Ocean background */}
                <rect width="100%" height="100%" fill="#e6dcb8" />
                {/* Grid lines */}
                {Array.from({ length: 20 }, (_, i) => (
                  <line
                    key={`v-${i}`}
                    x1={`${(i + 1) * 5}%`} y1="0"
                    x2={`${(i + 1) * 5}%`} y2="100%"
                    stroke="#c2b28f" strokeWidth="0.5"
                  />
                ))}
                {Array.from({ length: 20 }, (_, i) => (
                  <line
                    key={`h-${i}`}
                    x1="0" y1={`${(i + 1) * 5}%`}
                    x2="100%" y2={`${(i + 1) * 5}%`}
                    stroke="#c2b28f" strokeWidth="0.5"
                  />
                ))}

                {/* Cities */}
                {entidades
                  .filter((ent) => {
                    if (ent.eBarbaro) return filtro === 'todos' || filtro === 'inimigos';
                    // Filtro por relacao com aliaca do usuario
                    if (filtro === 'aliados') {
                      return ent.aliacaTag === aliacaTag && !!aliacaTag;
                    }
                    if (filtro === 'sem-alianca') {
                      return !ent.aliacaTag;
                    }
                    if (filtro === 'inimigos') {
                      return !!ent.aliacaTag && ent.aliacaTag !== aliacaTag;
                    }
                    return true; // 'todos'
                  })
                  .map((ent, idx) => {
                    const cx = 50 + (ent.mapaX / 5);
                    const cy = 50 + (ent.mapaY / 5);

                    if (ent.eBarbaro) {
                      return (
                        <g key={ent.id || idx}
                          onClick={() => aoClicarCidade(ent)}
                          onMouseEnter={() => setTooltip(ent)}
                          onMouseLeave={() => setTooltip(null)}
                          style={{ cursor: 'pointer' }}
                        >
                          <circle cx={`${cx}%`} cy={`${cy}%`} r="8" fill="#8B4513" stroke="#654321" strokeWidth="1" />
                          <text x={`${cx}%`} y={`${cy}%`} textAnchor="middle" dominantBaseline="central" fill="#fff" fontSize="8">
                            ⚔️
                          </text>
                        </g>
                      );
                    }

                    const corAlianca = getCorAlianca(ent.aliacaTag);
                    const eAliado = ent.aliacaTag === aliacaTag && !!aliacaTag;
                    const eInimigo = !!ent.aliacaTag && ent.aliacaTag !== aliacaTag;

                    return (
                      <g key={ent.cidadeId || idx}
                        onClick={() => aoClicarCidade(ent)}
                        onMouseEnter={() => setTooltip(ent)}
                        onMouseLeave={() => setTooltip(null)}
                        style={{ cursor: 'pointer' }}
                      >
                        <circle cx={`${cx}%`} cy={`${cy}%`} r={ent.nivelMaravilha ? 12 : 7}
                          fill={ent.nivelMaravilha ? '#FFD700' : (eAliado ? '#3b7a4a' : eInimigo ? '#7a3b3b' : '#2a4a6a')}
                          stroke={corAlianca}
                          strokeWidth={ent.aliacaTag ? 2 : 1}
                        />
                        {ent.nivelMaravilha ? (
                          <text x={`${cx}%`} y={`${cy}%`} textAnchor="middle" dominantBaseline="central" fill="#050E1A" fontSize="10">
                            ✦
                          </text>
                        ) : null}
                        <text x={`${cx}%`} y={`${parseFloat(`${cy}`) + 12}%`} textAnchor="middle"
                          fill="#3e2723" fontSize="6" fontWeight="bold">
                          {ent.nomeCidade}
                        </text>
                        {ent.aliacaTag ? (
                          <text x={`${cx}%`} y={`${parseFloat(`${cy}`) - 12}%`} textAnchor="middle"
                            fill={corAlianca} fontSize="6">
                            [{ent.aliacaTag}]
                          </text>
                        ) : null}
                      </g>
                    );
                  })}
              </svg>

              {tooltip && !tooltip.eBarbaro && (
                <div style={{
                  position: 'absolute', top: '10px', right: '10px',
                  background: 'rgba(255,248,225,0.95)', border: `1px solid ${getCorAlianca(tooltip.aliacaTag)}`,
                  borderRadius: '6px', padding: '10px 14px', fontSize: '0.8rem', zIndex: 20,
                  minWidth: '180px', color: '#3e2723',
                }}>
                  <div style={{ fontWeight: 'bold', color: '#6d4c41', marginBottom: '6px' }}>{tooltip.nomeCidade}</div>
                  <div style={{ color: '#5d4037', fontSize: '0.75rem' }}>Jogador: {tooltip.username || '—'}</div>
                  {tooltip.aliacaNome && <div style={{ color: '#5d4037', fontSize: '0.75rem' }}>Alianca: {tooltip.aliacaNome} [{tooltip.aliacaTag}]</div>}
                  {tooltip.pontos != null && <div style={{ color: '#5d4037', fontSize: '0.75rem' }}>Pontos: {tooltip.pontos.toLocaleString('pt-BR')}</div>}
                  {tooltip.nivelMaravilha ? <div style={{ color: '#FFD700', fontWeight: 'bold', marginTop: '4px' }}>★ Maravilha Nv.{tooltip.nivelMaravilha}</div> : null}
                </div>
              )}

              {/* Legend */}
              <div style={{
                position: 'absolute', bottom: '5px', left: '5px',
                background: 'rgba(255,248,225,0.9)', border: '1px solid #d4c09d', borderRadius: '4px',
                padding: '5px 8px', fontSize: '0.65rem', color: '#5d4037',
              }}>
                <div><span style={{ color: '#2a4a6a' }}>●</span> Cidade</div>
                <div><span style={{ color: '#8B4513' }}>●</span> Bárbaro</div>
                <div><span style={{ color: '#FFD700' }}>✦</span> Maravilha</div>
                <div><span style={{ color: '#6d4c41' }}>●</span> Com Aliança</div>
              </div>
            </div>
          </div>

          {entidades.length > 0 && (
            <div style={{ color: '#5d4037', fontSize: '0.75rem', marginTop: '5px', textAlign: 'center' }}>
              {entidades.filter(e => !e.eBarbaro).length} cidades, {entidades.filter(e => e.eBarbaro).length} bárbaros visíveis
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
