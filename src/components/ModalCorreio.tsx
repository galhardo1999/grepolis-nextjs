// ============================================================
// MODAL CORREIO — Inbox unificada (relatórios + mensagens)
// ============================================================
"use client";

import React, { useEffect, useState, useCallback } from 'react';

interface MensagemCombate {
  id: string;
  titulo: string;
  conteudo: object;
  tipo: 'combate';
  contraQuem: string;
  data: string;
  lido: boolean;
}

interface MensagemAlianca {
  id: string;
  remetenteUsername: string;
  remetenteCidade: string;
  texto: string;
  criadoEm: string;
  tipo: 'alianca';
  lido: boolean;
}

type Mensagem = MensagemCombate | MensagemAlianca;

export function ModalCorreio({ aberto, aoFechar }: { aberto: boolean; aoFechar: () => void }) {
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [naoLidos, setNaoLidos] = useState(0);
  const [selecionada, setSelecionada] = useState<Mensagem | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [abaAtiva, setAbaAtiva] = useState<'todas' | 'combate' | 'alianca'>('todas');

  const fetchMensagens = useCallback(async () => {
    setCarregando(true);
    try {
      const res = await fetch('/api/game/mensagens');
      if (res.ok) {
        const data = await res.json();
        setMensagens(data.messages || []);
        setNaoLidos(data.naoLidos || 0);
      }
    } catch {
      // silent
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    if (aberto) fetchMensagens();
  }, [aberto, fetchMensagens]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && aberto) aoFechar();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [aberto, aoFechar]);

  const marcarLido = async (ids: string[]) => {
    try {
      await fetch('/api/game/mensagens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      });
      setMensagens(prev =>
        prev.map(m => (ids.includes(m.id) ? { ...m, lido: true } : m))
      );
      if (selecionada && ids.includes(selecionada.id)) {
        setSelecionada(prev => (prev ? { ...prev, lido: true } : null));
      }
    } catch {
      // silent
    }
  };

  const marcarTodasLidas = async () => {
    try {
      await fetch('/api/game/mensagens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      setMensagens(prev => prev.map(m => ({ ...m, lido: true })));
      setNaoLidos(0);
    } catch {
      // silent
    }
  };

  const abrirMensagem = (msg: Mensagem) => {
    setSelecionada(msg);
    if (msg.tipo === 'combate' && !msg.lido) {
      marcarLido([msg.id]);
    }
  };

  if (!aberto) return null;

  const filtradas = mensagens.filter(m => {
    if (abaAtiva === 'combate') return m.tipo === 'combate';
    if (abaAtiva === 'alianca') return m.tipo === 'alianca';
    return true;
  });

  const formatarData = (d: string) => {
    const date = new Date(d);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderizarCombate = (msg: MensagemCombate) => {
    const conteudo = msg.conteudo as any;
    const resultado = conteudo?.resultado;
    if (!resultado) {
      return (
        <div style={{ padding: '15px', background: '#fff8e1', borderRadius: '8px', border: '1px solid #e0cda7' }}>
          <p style={{ color: '#5d4037' }}>Batalha contra <strong style={{ color: '#6d4c41' }}>{conteudo?.defensorCidade || conteudo?.defensorUsername || msg.contraQuem}</strong></p>
          <p style={{ color: '#8d6e63' }}>Detalhes indisponíveis.</p>
        </div>
      );
    }

    return (
      <div style={{ padding: '15px', background: '#fff8e1', borderRadius: '8px', border: '1px solid #e0cda7' }}>
        <p style={{ color: '#5d4037', marginBottom: '10px' }}>
          {resultado.sucesso ? '⚔️ Vitória' : '💀 Derrota'} contra{' '}
          <strong style={{ color: '#6d4c41' }}>{conteudo.defensorCidade || conteudo.defensorUsername || msg.contraQuem}</strong>
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
          <div>
            <h4 style={{ color: '#4ade80', margin: '0 0 8px' }}>Suas Perdas</h4>
            {Object.entries(resultado.baixasAtacante || {}).map(([id, baixas]) =>
              (baixas as number) > 0 ? (
                <div key={id} style={{ color: '#f87171', fontSize: '0.85rem' }}>
                  -{`${baixas as number}`}x {id}
                </div>
              ) : null
            )}
          </div>
          <div>
            <h4 style={{ color: '#4ade80', margin: '0 0 8px' }}>Perdas Inimigas</h4>
            {Object.entries(resultado.baixasDefensor || {}).map(([id, baixas]) =>
              (baixas as number) > 0 ? (
                <div key={id} style={{ color: '#fbbf24', fontSize: '0.85rem' }}>
                  -{`${baixas as number}`}x {id}
                </div>
              ) : null
            )}
          </div>
        </div>

        {resultado.sucesso && resultado.recursosRoubados && (
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px',
            background: '#eedcba', borderRadius: '6px', padding: '12px', border: '1px solid #d4c09d'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: '#8B4513', fontSize: '0.8rem' }}>Madeira</div>
              <div style={{ color: '#2e7d32', fontWeight: 'bold' }}>+{(resultado.recursosRoubados as any).madeira}</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: '#5d4037', fontSize: '0.8rem' }}>Pedra</div>
              <div style={{ color: '#2e7d32', fontWeight: 'bold' }}>+{(resultado.recursosRoubados as any).pedra}</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: '#5d4037', fontSize: '0.8rem' }}>Prata</div>
              <div style={{ color: '#2e7d32', fontWeight: 'bold' }}>+{(resultado.recursosRoubados as any).prata}</div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div id="modal-overlay" onClick={(e) => e.target === e.currentTarget && aoFechar()}>
      <div id="modal-container" className="senado-theme" style={{ width: '750px', maxWidth: '95vw' }}>
        <div id="modal-header">
          <h2 id="modal-title">
            Correio{' '}
            {naoLidos > 0 && (
              <span style={{
                background: '#e11d48', color: '#fff', fontSize: '0.7rem',
                padding: '2px 8px', borderRadius: '12px', marginLeft: '8px',
              }}>
                {naoLidos}
              </span>
            )}
          </h2>
          <button id="close-modal" onClick={aoFechar}>&times;</button>
        </div>
        <div id="modal-body" style={{ display: 'flex', gap: '0', minHeight: '400px', maxHeight: '60vh' }}>
          {/* Lista lateral */}
          <div style={{
            width: '280px', borderRight: '1px solid #e0cda7',
            display: 'flex', flexDirection: 'column', flexShrink: 0,
          }}>
            {/* Abas */}
            <div style={{ display: 'flex', gap: '0', borderBottom: '1px solid #e0cda7' }}>
              {(['todas', 'combate', 'alianca'] as const).map(aba => (
                <button
                  key={aba}
                  onClick={() => setAbaAtiva(aba)}
                  style={{
                    flex: 1, padding: '8px 4px', border: 'none', cursor: 'pointer',
                    background: abaAtiva === aba ? 'rgba(109,76,65,0.15)' : 'transparent',
                    color: abaAtiva === aba ? '#6d4c41' : '#8d6e63',
                    fontSize: '0.75rem', fontWeight: abaAtiva === aba ? 'bold' : 'normal',
                    textTransform: 'capitalize',
                  }}
                >
                  {aba}
                </button>
              ))}
            </div>

            {/* Header com marcat todas */}
            <div style={{
              padding: '8px 12px', display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', borderBottom: '1px solid #e0cda7',
            }}>
              <span style={{ color: '#5d4037', fontSize: '0.8rem' }}>{filtradas.length} mensagens</span>
              {naoLidos > 0 && (
                <button
                  onClick={marcarTodasLidas}
                  style={{
                    background: 'none', border: '1px solid #d4c09d', borderRadius: '4px',
                    color: '#8d6e63', padding: '4px 8px', cursor: 'pointer', fontSize: '0.75rem',
                  }}
                >
                  Marcar todas como lidas
                </button>
              )}
            </div>

            {/* Lista de mensagens */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {carregando ? (
                <div style={{ padding: '20px', textAlign: 'center', color: '#8d6e63' }}>
                  Carregando...
                </div>
              ) : filtradas.length === 0 ? (
                <div style={{ padding: '30px', textAlign: 'center', color: '#8d6e63' }}>
                  Nenhuma mensagem
                </div>
              ) : (
                filtradas.map((msg) => (
                  <div
                    key={msg.id}
                    onClick={() => abrirMensagem(msg)}
                    style={{
                      padding: '10px 12px',
                      cursor: 'pointer',
                      borderBottom: '1px solid #e0cda7',
                      background: selecionada?.id === msg.id
                        ? 'rgba(109,76,65,0.1)'
                        : !msg.lido && msg.tipo === 'combate'
                          ? 'rgba(248,113,113,0.05)'
                          : 'transparent',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={(e) => {
                      if (selecionada?.id !== msg.id) e.currentTarget.style.background = 'rgba(109,76,65,0.03)';
                    }}
                    onMouseLeave={(e) => {
                      if (selecionada?.id !== msg.id) e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <div style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    }}>
                      <span style={{
                        fontWeight: !msg.lido ? 'bold' : 'normal',
                        color: msg.tipo === 'alianca' ? '#1e3a8a' : '#6d4c41',
                        fontSize: '0.85rem',
                      }}>
                        {msg.tipo === 'combate' ? (msg as MensagemCombate).titulo : `💬 ${(msg as MensagemAlianca).remetenteUsername}`}
                      </span>
                    </div>
                    <div style={{
                      color: '#5d4037', fontSize: '0.75rem',
                      marginTop: '4px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {msg.tipo === 'combate' ? msg.contraQuem : (msg as MensagemAlianca).remetenteCidade}
                    </div>
                    <div style={{ color: '#8d6e63', fontSize: '0.7rem', marginTop: '2px' }}>
                      {formatarData(msg.tipo === 'combate' ? (msg as MensagemCombate).data : (msg as MensagemAlianca).criadoEm)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Conteúdo */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '15px' }}>
            {!selecionada ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#8d6e63' }}>
                Selecione uma mensagem
              </div>
            ) : selecionada.tipo === 'combate' ? (
              renderizarCombate(selecionada as MensagemCombate)
            ) : (
              <div style={{ padding: '15px', background: '#fff8e1', borderRadius: '8px', border: '1px solid #e0cda7' }}>
                <p style={{ color: '#1e3a8a', margin: '0 0 5px', fontSize: '0.85rem', fontWeight: 'bold' }}>
                  De: {(selecionada as MensagemAlianca).remetenteUsername} — {(selecionada as MensagemAlianca).remetenteCidade}
                </p>
                <p style={{ color: '#8d6e63', fontSize: '0.75rem', margin: '0 0 15px' }}>
                  {formatarData((selecionada as MensagemAlianca).criadoEm)}
                </p>
                <p style={{ color: '#3e2723', fontSize: '0.95rem', lineHeight: '1.6' }}>
                  {(selecionada as MensagemAlianca).texto}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
