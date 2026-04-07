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
}

interface Props {
  aberto: boolean;
  aoFechar: () => void;
  aoClicarCidade: (entidade: EntidadeMapa) => void;
}

export function MapaMundo({ aberto, aoFechar, aoClicarCidade }: Props) {
  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [entidades, setEntidades] = useState<EntidadeMapa[]>([]);
  const [ilhaAtiva, setIlhaAtiva] = useState<number | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });

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
      <div id="modal-container" style={{ width: '900px', height: '650px' }}>
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
                padding: '6px 14px', background: '#D4AF37', color: '#050E1A',
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
                    padding: '4px 10px', background: ilhaAtiva === i ? '#D4AF37' : '#1a1a3a',
                    color: ilhaAtiva === i ? '#050E1A' : '#D4AF37',
                    border: '1px solid #D4AF37', borderRadius: '4px', cursor: 'pointer',
                    fontSize: '0.8rem',
                  }}
                >
                  Ilha {i}
                </button>
              ))}
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px', alignItems: 'center' }}>
              <button onClick={() => setZoom(z => Math.max(0.3, z - 0.2))}
                style={{ padding: '4px 10px', background: '#1a1a3a', color: '#D4AF37', border: '1px solid #D4AF37', borderRadius: '4px', cursor: 'pointer' }}>
                -
              </button>
              <span style={{ color: '#D4AF37', fontSize: '0.8rem' }}>{Math.round(zoom * 100)}%</span>
              <button onClick={() => setZoom(z => Math.min(3, z + 0.2))}
                style={{ padding: '4px 10px', background: '#1a1a3a', color: '#D4AF37', border: '1px solid #D4AF37', borderRadius: '4px', cursor: 'pointer' }}>
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
              background: '#0a1525',
              borderRadius: '8px',
              overflow: 'hidden',
              cursor: isDragging.current ? 'grabbing' : 'grab',
              border: '1px solid #1a2a4a',
              position: 'relative',
            }}
          >
            {carregando && (
              <div style={{
                position: 'absolute', inset: 0, display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                background: 'rgba(10,21,37,0.8)', zIndex: 10,
                color: '#D4AF37', fontSize: '1.2rem',
              }}>
                Carregando mapa...
              </div>
            )}

            {erro && (
              <div style={{
                position: 'absolute', inset: 0, display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                background: 'rgba(10,21,37,0.8)', zIndex: 10,
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
                <rect width="100%" height="100%" fill="#0a1525" />
                {/* Grid lines */}
                {Array.from({ length: 20 }, (_, i) => (
                  <line
                    key={`v-${i}`}
                    x1={`${(i + 1) * 5}%`} y1="0"
                    x2={`${(i + 1) * 5}%`} y2="100%"
                    stroke="#1a2a4a" strokeWidth="0.5"
                  />
                ))}
                {Array.from({ length: 20 }, (_, i) => (
                  <line
                    key={`h-${i}`}
                    x1="0" y1={`${(i + 1) * 5}%`}
                    x2="100%" y2={`${(i + 1) * 5}%`}
                    stroke="#1a2a4a" strokeWidth="0.5"
                  />
                ))}

                {/* Cities */}
                {entidades.map((ent, idx) => {
                  // Map coords to SVG coords (centered)
                  const cx = 50 + (ent.mapaX / 5);
                  const cy = 50 + (ent.mapaY / 5);

                  if (ent.eBarbaro) {
                    return (
                      <g key={ent.id || idx}
                        onClick={() => aoClicarCidade(ent)}
                        style={{ cursor: 'pointer' }}
                      >
                        <circle cx={`${cx}%`} cy={`${cy}%`} r="8" fill="#8B4513" stroke="#654321" strokeWidth="1" />
                        <text x={`${cx}%`} y={`${cy}%`} textAnchor="middle" dominantBaseline="central" fill="#fff" fontSize="8">
                          ⚔️
                        </text>
                      </g>
                    );
                  }

                  const corAlianca = ent.aliacaTag ? '#D4AF37' : '#444';

                  return (
                    <g key={ent.cidadeId}
                      onClick={() => aoClicarCidade(ent)}
                      style={{ cursor: 'pointer' }}
                    >
                      <circle cx={`${cx}%`} cy={`${cy}%`} r={ent.nivelMaravilha ? 12 : 7}
                        fill={ent.nivelMaravilha ? '#FFD700' : '#2a4a6a'}
                        stroke={corAlianca}
                        strokeWidth={ent.aliacaTag ? 2 : 1}
                      />
                      {ent.nivelMaravilha ? (
                        <text x={`${cx}%`} y={`${cy}%`} textAnchor="middle" dominantBaseline="central" fill="#050E1A" fontSize="10">
                          ✦
                        </text>
                      ) : null}
                      {/* Label */}
                      <text x={`${cx}%`} y={`${parseFloat(`${cy}`) + 12}%`} textAnchor="middle"
                        fill="#aaa" fontSize="6">
                        {ent.nomeCidade || ent.nome}
                      </text>
                      {ent.aliacaTag ? (
                        <text x={`${cx}%`} y={`${parseFloat(`${cy}`) - 12}%`} textAnchor="middle"
                          fill="#D4AF37" fontSize="6">
                          [{ent.aliacaTag}]
                        </text>
                      ) : null}
                    </g>
                  );
                })}
              </svg>

              {/* Legend */}
              <div style={{
                position: 'absolute', bottom: '5px', left: '5px',
                background: 'rgba(10,21,37,0.9)', borderRadius: '4px',
                padding: '5px 8px', fontSize: '0.65rem', color: '#aaa',
              }}>
                <div><span style={{ color: '#2a4a6a' }}>●</span> Cidade</div>
                <div><span style={{ color: '#8B4513' }}>●</span> Bárbaro</div>
                <div><span style={{ color: '#FFD700' }}>✦</span> Maravilha</div>
                <div><span style={{ color: '#D4AF37' }}>●</span> Com Aliança</div>
              </div>
            </div>
          </div>

          {entidades.length > 0 && (
            <div style={{ color: '#aaa', fontSize: '0.75rem', marginTop: '5px', textAlign: 'center' }}>
              {entidades.filter(e => !e.eBarbaro).length} cidades, {entidades.filter(e => e.eBarbaro).length} bárbaros visíveis
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
