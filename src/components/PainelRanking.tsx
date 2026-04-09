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
  const [categoria, setCategoria] = useState<'jogadores' | 'aliancas'>('jogadores');
  const [minhaPosicao, setMinhaPosicao] = useState<number | null>(null);
  const [carregando, setCarregando] = useState(false);

  const carregar = useCallback(async (pg?: number) => {
    setCarregando(true);
    const p = pg ?? pagina;
    const res = await fetch(`/api/game/ranking?categoria=pontos&pagina=${p}`);
    if (!res.ok) { setCarregando(false); return; }
    const data = await res.json();
    setRanking(data.ranking || []);
    setRankingAliancas(data.rankingAliancas || []);
    setMinhaPosicao(data.minhasPosicoes?.pontos || null);
    setTotalPaginas(data.totalPaginas || 1);
    setPagina(p);
    setCarregando(false);
  }, [pagina]);

  useEffect(() => {
    if (aberto) carregar();
  }, [aberto, carregar]);

  if (!aberto) return null;

  return (
    <div id="modal-overlay" onClick={(e) => e.target === e.currentTarget && aoFechar()}>
      <div id="modal-container" className="senado-theme" style={{ width: '750px', maxWidth: '90vw' }}>
        <div id="modal-header">
          <h2 id="modal-title">🏆 Ranking</h2>
          <button id="close-modal" onClick={aoFechar}>&times;</button>
        </div>
        <div id="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '15px', alignItems: 'center' }}>
            <button onClick={() => { setCategoria('jogadores'); carregar(0); }}
              style={{ padding: '6px 14px', background: categoria === 'jogadores' ? '#6d4c41' : '#eedcba', color: categoria === 'jogadores' ? '#fff8e1' : '#6d4c41', border: '1px solid #6d4c41', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}>
              Jogadores
            </button>
            <button onClick={() => { setCategoria('aliancas'); carregar(0); }}
              style={{ padding: '6px 14px', background: categoria === 'aliancas' ? '#6d4c41' : '#eedcba', color: categoria === 'aliancas' ? '#fff8e1' : '#6d4c41', border: '1px solid #6d4c41', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}>
              Alianças
            </button>
          </div>

          {/* Minha posicao */}
          {minhaPosicao && categoria === 'jogadores' && (
            <div style={{
              padding: '8px 12px', background: '#fff8e1', borderRadius: '6px',
              marginBottom: '12px', border: '1px solid #e0cda7', fontSize: '0.9rem', color: '#6d4c41',
            }}>
              🏅 Sua posição: <strong>#{minhaPosicao}</strong>
            </div>
          )}

          {carregando ? (
            <div style={{ textAlign: 'center', color: '#D4AF37', padding: '30px' }}>Carregando...</div>
          ) : (
            <>
              {categoria === 'jogadores' && (
                <>
                  <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #6d4c41' }}>
                        <th style={{ textAlign: 'left', padding: '8px', color: '#6d4c41' }}>#</th>
                        <th style={{ textAlign: 'left', padding: '8px', color: '#6d4c41' }}>Jogador</th>
                        <th style={{ textAlign: 'left', padding: '8px', color: '#6d4c41' }}>Aliança</th>
                        <th style={{ textAlign: 'right', padding: '8px', color: '#6d4c41' }}>Pontos</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ranking.map((j, i) => (
                        <tr key={j.id} style={{
                          borderBottom: '1px solid #e0cda7',
                          background: i % 2 === 0 ? 'rgba(109,76,65,0.05)' : 'transparent',
                        }}>
                          <td style={{ padding: '8px', color: '#5d4037' }}>{j.posicao}</td>
                          <td style={{ padding: '8px', color: '#3e2723', fontWeight: 'bold' }}>{j.username}</td>
                          <td style={{ padding: '8px', color: '#' }}>
                            {j.aliacaTag ? (
                              <span style={{ color: '#8d6e63', fontSize: '0.8rem', fontWeight: 'bold' }}>[{j.aliacaTag}]</span>
                            ) : <span style={{ color: '#aaa' }}>—</span>}
                          </td>
                          <td style={{ padding: '8px', textAlign: 'right', color: '#6d4c41', fontWeight: 'bold' }}>{j.pontos}</td>
                        </tr>
                      ))}
                      {ranking.length === 0 && (
                        <tr><td colSpan={4} style={{ textAlign: 'center', padding: '20px', color: '#8d6e63' }}>
                          Nenhum jogador encontrado.
                        </td></tr>
                      )}
                    </tbody>
                  </table>

                  {/* Paginacao */}
                  <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', marginBottom: '20px' }}>
                    <button disabled={pagina === 0} onClick={() => carregar(pagina - 1)}
                      style={{ padding: '4px 12px', background: pagina === 0 ? '#d7ccc8' : '#eedcba', color: pagina === 0 ? '#bcaaa4' : '#6d4c41', border: '1px solid #d4c09d', borderRadius: '4px', cursor: pagina === 0 ? 'not-allowed' : 'pointer' }}>
                      Anterior
                    </button>
                    <span style={{ color: '#5d4037', padding: '4px 8px' }}>Página {pagina + 1} de {totalPaginas}</span>
                    <button disabled={pagina >= totalPaginas - 1} onClick={() => carregar(pagina + 1)}
                      style={{ padding: '4px 12px', background: pagina >= totalPaginas - 1 ? '#d7ccc8' : '#eedcba', color: pagina >= totalPaginas - 1 ? '#bcaaa4' : '#6d4c41', border: '1px solid #d4c09d', borderRadius: '4px', cursor: pagina >= totalPaginas - 1 ? 'not-allowed' : 'pointer' }}>
                      Próxima
                    </button>
                  </div>
                </>
              )}

              {/* Ranking de Aliancas */}
              {categoria === 'aliancas' && (
                <>
                  {rankingAliancas.length > 0 ? (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                      <thead>
                        <tr style={{ borderBottom: '2px solid #6d4c41' }}>
                          <th style={{ textAlign: 'left', padding: '6px', color: '#6d4c41' }}>#</th>
                          <th style={{ textAlign: 'left', padding: '6px', color: '#6d4c41' }}>Aliança</th>
                          <th style={{ textAlign: 'right', padding: '6px', color: '#6d4c41' }}>Membros</th>
                          <th style={{ textAlign: 'right', padding: '6px', color: '#6d4c41' }}>Pontos</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rankingAliancas.map((a, i) => (
                          <tr key={a.id} style={{ borderBottom: '1px solid #e0cda7', background: i === 0 ? 'rgba(109,76,65,0.1)' : 'transparent' }}>
                            <td style={{ padding: '6px', color: i === 0 ? '#8B4513' : '#5d4037' }}>{i + 1}</td>
                            <td style={{ padding: '6px', color: '#3e2723', fontWeight: 'bold' }}>[{a.tag}] {a.nome}</td>
                            <td style={{ padding: '6px', textAlign: 'right', color: '#5d4037' }}>{a.membrosCount}</td>
                            <td style={{ padding: '6px', textAlign: 'right', color: '#6d4c41', fontWeight: 'bold' }}>{a.pontosTotais}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '20px', color: '#8d6e63' }}>
                      Nenhuma aliança encontrada.
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
