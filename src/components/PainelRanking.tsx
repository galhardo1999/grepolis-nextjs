// ============================================================
// PAINEL DE RANKING — Leaderboard
// ============================================================
"use client";

import React, { useState, useEffect, useCallback } from 'react';

interface JogadorRanking {
  posicao: number;
  id: string;
  nomeCidade: string;
  username: string;
  pontos: number;
  nivelMaravilha: number;
  aliacaTag: string | null;
  aliacaNome: string | null;
}

interface AliancaRanking {
  posicao: number;
  id: string;
  nome: string;
  tag: string;
  membrosCount: number;
  pontosTotais: number;
}

interface Props {
  aberto: boolean;
  aoFechar: () => void;
}

export function PainelRanking({ aberto, aoFechar }: Props) {
  const [ranking, setRanking] = useState<JogadorRanking[]>([]);
  const [rankingAliancas, setRankingAliancas] = useState<AliancaRanking[]>([]);
  const [pagina, setPagina] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [categoria, setCategoria] = useState<'pontos' | 'maravilha'>('pontos');
  const [minhaPosicao, setMinhaPosicao] = useState<number | null>(null);
  const [carregando, setCarregando] = useState(false);

  const carregar = useCallback(async (cat?: string, pg?: number) => {
    setCarregando(true);
    const c = cat || categoria;
    const p = pg ?? pagina;
    const res = await fetch(`/api/game/ranking?categoria=${c}&pagina=${p}`);
    if (!res.ok) { setCarregando(false); return; }
    const data = await res.json();
    setRanking(data.ranking || []);
    setRankingAliancas(data.rankingAliancas || []);
    setMinhaPosicao(data.minhasPosicoes?.pontos || null);
    setTotalPaginas(data.totalPaginas || 1);
    setPagina(p);
    setCarregando(false);
  }, [categoria, pagina]);

  useEffect(() => {
    if (aberto) carregar();
  }, [aberto, carregar]);

  if (!aberto) return null;

  return (
    <div id="modal-overlay" onClick={(e) => e.target === e.currentTarget && aoFechar()}>
      <div id="modal-container" style={{ width: '750px', maxWidth: '90vw' }}>
        <div id="modal-header">
          <h2 id="modal-title">🏆 Ranking</h2>
          <button id="close-modal" onClick={aoFechar}>&times;</button>
        </div>
        <div id="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '15px', alignItems: 'center' }}>
            <button onClick={() => { setCategoria('pontos'); carregar('pontos', 0); }}
              style={{ padding: '6px 14px', background: categoria === 'pontos' ? '#D4AF37' : '#1a1a3a', color: categoria === 'pontos' ? '#050E1A' : '#D4AF37', border: '1px solid #D4AF37', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}>
              Por Pontos
            </button>
            <button onClick={() => { setCategoria('maravilha'); carregar('maravilha', 0); }}
              style={{ padding: '6px 14px', background: categoria === 'maravilha' ? '#D4AF37' : '#1a1a3a', color: categoria === 'maravilha' ? '#050E1A' : '#D4AF37', border: '1px solid #D4AF37', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}>
              Maravilha
            </button>
          </div>

          {/* Minha posicao */}
          {minhaPosicao && (
            <div style={{
              padding: '8px 12px', background: '#1a1a3a', borderRadius: '6px',
              marginBottom: '12px', border: '1px solid #D4AF37', fontSize: '0.9rem', color: '#D4AF37',
            }}>
              🏅 Sua posição: <strong>#{minhaPosicao}</strong>
            </div>
          )}

          {carregando ? (
            <div style={{ textAlign: 'center', color: '#D4AF37', padding: '30px' }}>Carregando...</div>
          ) : (
            <>
              {/* Tabela de Jogadores */}
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #D4AF37' }}>
                    <th style={{ textAlign: 'left', padding: '8px', color: '#D4AF37' }}>#</th>
                    <th style={{ textAlign: 'left', padding: '8px', color: '#D4AF37' }}>Jogador</th>
                    <th style={{ textAlign: 'left', padding: '8px', color: '#D4AF37' }}>Aliança</th>
                    <th style={{ textAlign: 'right', padding: '8px', color: '#D4AF37' }}>Pontos</th>
                    <th style={{ textAlign: 'right', padding: '8px', color: '#D4AF37' }}>Maravilha</th>
                  </tr>
                </thead>
                <tbody>
                  {ranking.map((j, i) => (
                    <tr key={j.id} style={{
                      borderBottom: '1px solid #1a1a3a',
                      background: i % 2 === 0 ? 'rgba(26,26,58,0.3)' : 'transparent',
                    }}>
                      <td style={{ padding: '8px', color: '#888' }}>{j.posicao}</td>
                      <td style={{ padding: '8px', color: '#ddd' }}>{j.username} — {j.nomeCidade}</td>
                      <td style={{ padding: '8px', color: '#' }}>
                        {j.aliacaTag ? (
                          <span style={{ color: '#D4AF37', fontSize: '0.8rem' }}>[{j.aliacaTag}]</span>
                        ) : <span style={{ color: '#444' }}>—</span>}
                      </td>
                      <td style={{ padding: '8px', textAlign: 'right', color: '#D4AF37', fontWeight: 'bold' }}>{j.pontos}</td>
                      <td style={{ padding: '8px', textAlign: 'right', color: '#aaa' }}>
                        {j.nivelMaravilha > 0 ? `Nv. ${j.nivelMaravilha}` : '—'}
                      </td>
                    </tr>
                  ))}
                  {ranking.length === 0 && (
                    <tr><td colSpan={5} style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                      Nenhum jogador encontrado.
                    </td></tr>
                  )}
                </tbody>
              </table>

              {/* Paginacao */}
              <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', marginBottom: '20px' }}>
                <button disabled={pagina === 0} onClick={() => carregar(undefined, pagina - 1)}
                  style={{ padding: '4px 12px', background: pagina === 0 ? '#111' : '#1a1a3a', color: pagina === 0 ? '#444' : '#D4AF37', border: '1px solid #333', borderRadius: '4px', cursor: pagina === 0 ? 'not-allowed' : 'pointer' }}>
                  Anterior
                </button>
                <span style={{ color: '#888', padding: '4px 8px' }}>Página {pagina + 1} de {totalPaginas}</span>
                <button disabled={pagina >= totalPaginas - 1} onClick={() => carregar(undefined, pagina + 1)}
                  style={{ padding: '4px 12px', background: pagina >= totalPaginas - 1 ? '#111' : '#1a1a3a', color: pagina >= totalPaginas - 1 ? '#444' : '#D4AF37', border: '1px solid #333', borderRadius: '4px', cursor: pagina >= totalPaginas - 1 ? 'not-allowed' : 'pointer' }}>
                  Próxima
                </button>
              </div>

              {/* Ranking de Aliancas */}
              {rankingAliancas.length > 0 && (
                <>
                  <h3 style={{ color: '#D4AF37', marginBottom: '10px', fontSize: '1rem' }}>🏛️ Ranking de Alianças</h3>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #D4AF37' }}>
                        <th style={{ textAlign: 'left', padding: '6px', color: '#D4AF37' }}>#</th>
                        <th style={{ textAlign: 'left', padding: '6px', color: '#D4AF37' }}>Aliança</th>
                        <th style={{ textAlign: 'right', padding: '6px', color: '#D4AF37' }}>Membros</th>
                        <th style={{ textAlign: 'right', padding: '6px', color: '#D4AF37' }}>Pontos</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rankingAliancas.map((a, i) => (
                        <tr key={a.id} style={{ borderBottom: '1px solid #1a1a3a', background: i === 0 ? 'rgba(212,175,55,0.1)' : 'transparent' }}>
                          <td style={{ padding: '6px', color: i === 0 ? '#FFD700' : '#888' }}>{i + 1}</td>
                          <td style={{ padding: '6px', color: '#ddd' }}>[{a.tag}] {a.nome}</td>
                          <td style={{ padding: '6px', textAlign: 'right', color: '#aaa' }}>{a.membrosCount}</td>
                          <td style={{ padding: '6px', textAlign: 'right', color: '#D4AF37', fontWeight: 'bold' }}>{a.pontosTotais}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
