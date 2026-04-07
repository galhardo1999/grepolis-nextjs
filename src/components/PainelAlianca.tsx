// ============================================================
// PAINEL DE ALIANÇA — UI para gerir aliança + chat
// ============================================================
"use client";

import React, { useState, useCallback, useEffect } from 'react';

interface MembroAlianca {
  id: string;
  nomeCidade: string;
  username: string;
  pontos: number;
}

interface Mensagem {
  id: string;
  texto: string;
  username: string;
  nomeCidade: string;
  criadoEm: number;
}

interface Alianca {
  id: string;
  nome: string;
  tag: string;
  descricao: string;
  membros: MembroAlianca[];
}

interface AliancaResumo {
  id: string;
  nome: string;
  tag: string;
  descricao: string;
  membrosCount: number;
}

interface Props {
  aberto: boolean;
  aoFechar: () => void;
}

export function PainelAlianca({ aberto, aoFechar }: Props) {
  const [minhaAlianca, setMinhaAlianca] = useState<Alianca | null>(null);
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [textoChat, setTextoChat] = useState('');
  const [listaAliancas, setListaAliancas] = useState<AliancaResumo[]>([]);
  const [tab, setTab] = useState<'minha' | 'chat' | 'listar' | 'criar'>('minha');
  const [nomeNova, setNomeNova] = useState('');
  const [tagNova, setTagNova] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);
  const chatRef = React.useRef<HTMLDivElement>(null);

  const carregar = useCallback(async () => {
    const res = await fetch('/api/game/alianca');
    if (!res.ok) return;
    const data = await res.json();
    if (data.minhaAlianca) {
      setMinhaAlianca(data.minhaAlianca);
      setMensagens(data.mensagens || []);
      setTab('minha');
    } else {
      setMinhaAlianca(null);
      setMensagens([]);
    }
  }, []);

  const listarAliancas = useCallback(async () => {
    const res = await fetch('/api/game/alianca?acao=listar');
    if (!res.ok) return;
    const data = await res.json();
    setListaAliancas(data.aliancas || []);
    setTab('listar');
  }, []);

  const criarAlianca = async () => {
    setErro(null);
    setSucesso(null);
    const res = await fetch('/api/game/alianca', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ acao: 'criar', nome: nomeNova, tag: tagNova, descricao: '' }),
    });
    const data = await res.json();
    if (!res.ok) { setErro(data.erro); return; }
    setSucesso('Aliança criada com sucesso!');
    carregar();
    setNomeNova('');
    setTagNova('');
  };

  const entrarAlianca = async (aliacaId: string) => {
    setErro(null);
    const res = await fetch('/api/game/alianca', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ acao: 'entrar', aliacaId }),
    });
    const data = await res.json();
    if (!res.ok) { setErro(data.erro); return; }
    carregar();
  };

  const sairAlianca = async () => {
    const res = await fetch('/api/game/alianca', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ acao: 'sair' }),
    });
    if (res.ok) {
      setMinhaAlianca(null);
      setMensagens([]);
      setTab('criar');
    }
  };

  const enviarMensagem = async () => {
    if (!textoChat.trim()) return;
    setErro(null);
    const res = await fetch('/api/game/alianca', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ acao: 'mensagem', texto: textoChat.trim() }),
    });
    const data = await res.json();
    if (!res.ok) { setErro(data.erro); return; }
    setTextoChat('');
    carregar();
  };

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [mensagens]);

  useEffect(() => {
    if (aberto) carregar();
  }, [aberto, carregar]);

  // Poll chat a cada 5s
  useEffect(() => {
    if (!aberto || !minhaAlianca) return;
    const timer = setInterval(carregar, 5000);
    return () => clearInterval(timer);
  }, [aberto, minhaAlianca, carregar]);

  if (!aberto) return null;

  return (
    <div id="modal-overlay" onClick={(e) => e.target === e.currentTarget && aoFechar()}>
      <div id="modal-container" style={{ width: '700px', maxHeight: '600px' }}>
        <div id="modal-header">
          <h2 id="modal-title">🏛️ Alianças</h2>
          <button id="close-modal" onClick={aoFechar}>&times;</button>
        </div>
        <div id="modal-body">
          {erro && (
            <div style={{ padding: '8px', background: '#2a0a0a', border: '1px solid #f87171', borderRadius: '4px', color: '#f87171', marginBottom: '10px', fontSize: '0.9rem' }}>
              {erro}
            </div>
          )}
          {sucesso && (
            <div style={{ padding: '8px', background: '#0a2a0a', border: '1px solid #4ade80', borderRadius: '4px', color: '#4ade80', marginBottom: '10px', fontSize: '0.9rem' }}>
              {sucesso}
            </div>
          )}

          {/* Tabs */}
          <div style={{ display: 'flex', gap: '4px', marginBottom: '15px' }}>
            <button onClick={() => { setTab('minha'); carregar(); }}
              style={{ padding: '6px 14px', background: tab === 'minha' ? '#D4AF37' : '#1a1a3a', color: tab === 'minha' ? '#050E1A' : '#D4AF37', border: '1px solid #D4AF37', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
              Minha Aliança
            </button>
            {minhaAlianca && (
              <button onClick={() => setTab('chat')}
                style={{ padding: '6px 14px', background: tab === 'chat' ? '#D4AF37' : '#1a1a3a', color: tab === 'chat' ? '#050E1A' : '#D4AF37', border: '1px solid #D4AF37', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                Chat ({mensagens.length})
              </button>
            )}
            <button onClick={() => { setTab('listar'); listarAliancas(); }}
              style={{ padding: '6px 14px', background: tab === 'listar' ? '#D4AF37' : '#1a1a3a', color: tab === 'listar' ? '#050E1A' : '#D4AF37', border: '1px solid #D4AF37', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
              Listar
            </button>
            {!minhaAlianca && (
              <button onClick={() => setTab('criar')}
                style={{ padding: '6px 14px', background: tab === 'criar' ? '#D4AF37' : '#1a1a3a', color: tab === 'criar' ? '#050E1A' : '#D4AF37', border: '1px solid #D4AF37', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                Criar
              </button>
            )}
          </div>

          {/* Minhas Aliança */}
          {tab === 'minha' && minhaAlianca && (
            <div>
              <div style={{ background: '#1a1a3a', borderRadius: '8px', padding: '15px', marginBottom: '15px' }}>
                <h3 style={{ color: '#D4AF37', margin: '0 0 5px 0' }}>
                  [{minhaAlianca.tag}] {minhaAlianca.nome}
                </h3>
                {minhaAlianca.descricao && (
                  <p style={{ color: '#aaa', margin: '0 0 15px 0', fontSize: '0.9rem' }}>{minhaAlianca.descricao}</p>
                )}
                <h4 style={{ color: '#D4AF37', margin: '0 0 10px 0', fontSize: '0.9rem' }}>
                  Membros ({minhaAlianca.membros.length})
                </h4>
                <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
                  {minhaAlianca.membros.map((m, i) => (
                    <div key={m.id} style={{
                      display: 'flex', justifyContent: 'space-between', padding: '6px 10px',
                      background: i % 2 === 0 ? '#12122a' : '#0d0d20', borderRadius: '4px',
                      marginBottom: '2px', fontSize: '0.85rem',
                    }}>
                      <span style={{ color: '#ddd' }}>{m.username} — {m.nomeCidade}</span>
                      <span style={{ color: '#D4AF37' }}>{m.pontos} pts</span>
                    </div>
                  ))}
                </div>
              </div>
              <button onClick={sairAlianca}
                style={{ padding: '6px 14px', background: '#5a1a1a', color: '#f87171', border: '1px solid #f87171', borderRadius: '4px', cursor: 'pointer' }}>
                Sair da Aliança
              </button>
            </div>
          )}

          {tab === 'minha' && !minhaAlianca && (
            <div style={{ color: '#aaa', textAlign: 'center', padding: '30px' }}>
              <p>Você não pertence a nenhuma aliança.</p>
              <p>Crie uma ou junte-se a uma existente.</p>
              <button onClick={() => setTab('listar')}
                style={{ padding: '8px 20px', background: '#D4AF37', color: '#050E1A', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', marginTop: '10px' }}>
                Ver Alianças Disponíveis
              </button>
            </div>
          )}

          {/* Chat */}
          {tab === 'chat' && minhaAlianca && (
            <div>
              <h3 style={{ color: '#D4AF37', margin: '0 0 10px 0' }}>Chat — [{minhaAlianca.tag}] {minhaAlianca.nome}</h3>
              <div ref={chatRef} style={{
                height: '300px', overflowY: 'auto', background: '#0a0a1a', borderRadius: '6px',
                padding: '10px', marginBottom: '10px', border: '1px solid #2a2a4a',
              }}>
                {mensagens.length === 0 ? (
                  <p style={{ color: '#555', textAlign: 'center' }}>Nenhuma mensagem ainda. Seja o primeiro!</p>
                ) : (
                  mensagens.map((msg) => (
                    <div key={msg.id} style={{ marginBottom: '6px', fontSize: '0.85rem' }}>
                      <span style={{ color: '#D4AF37', fontWeight: 'bold' }}>{msg.username}</span>
                      <span style={{ color: '#666', fontSize: '0.7rem', marginLeft: '6px' }}>
                        {new Date(msg.criadoEm).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <div style={{ color: '#ddd', marginTop: '2px' }}>{msg.texto}</div>
                    </div>
                  ))
                )}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  value={textoChat}
                  onChange={(e) => setTextoChat(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && enviarMensagem()}
                  placeholder="Escrever mensagem..."
                  maxLength={500}
                  style={{
                    flex: 1, padding: '8px', background: '#1a1a3a', border: '1px solid #2a2a4a',
                    borderRadius: '4px', color: '#ddd', fontSize: '0.9rem',
                  }}
                />
                <button onClick={enviarMensagem}
                  style={{ padding: '8px 16px', background: '#D4AF37', color: '#050E1A', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                  Enviar
                </button>
              </div>
            </div>
          )}

          {/* Listar */}
          {tab === 'listar' && (
            <div>
              <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
                {listaAliancas.map(aliaca => (
                  <div key={aliaca.id} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px', background: '#1a1a3a', borderRadius: '6px', marginBottom: '6px',
                  }}>
                    <div>
                      <div style={{ color: '#D4AF37', fontWeight: 'bold' }}>
                        [{aliaca.tag}] {aliaca.nome}
                      </div>
                      <div style={{ color: '#888', fontSize: '0.8rem' }}>{aliaca.membrosCount} membros</div>
                    </div>
                    <button onClick={() => entrarAlianca(aliaca.id)}
                      disabled={!!minhaAlianca}
                      style={{
                        padding: '6px 12px', background: minhaAlianca ? '#333' : '#D4AF37',
                        color: minhaAlianca ? '#666' : '#050E1A', border: 'none', borderRadius: '4px',
                        cursor: minhaAlianca ? 'not-allowed' : 'pointer', fontWeight: 'bold', fontSize: '0.8rem',
                      }}>
                      {minhaAlianca ? 'Já em aliança' : 'Entrar'}
                    </button>
                  </div>
                ))}
                {listaAliancas.length === 0 && (
                  <p style={{ color: '#666', textAlign: 'center', padding: '20px' }}>Nenhuma aliança encontrada.</p>
                )}
              </div>
            </div>
          )}

          {/* Criar */}
          {tab === 'criar' && (
            <div>
              <div style={{ background: '#1a1a3a', borderRadius: '8px', padding: '20px' }}>
                <h3 style={{ color: '#D4AF37', margin: '0 0 15px 0' }}>Criar Nova Aliança</h3>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ color: '#aaa', fontSize: '0.85rem', display: 'block', marginBottom: '4px' }}>Nome</label>
                  <input
                    value={nomeNova}
                    onChange={(e) => setNomeNova(e.target.value)}
                    maxLength={30}
                    placeholder="Nome da aliança"
                    style={{ width: '100%', padding: '8px', background: '#0a0a1a', border: '1px solid #2a2a4a', borderRadius: '4px', color: '#ddd', fontSize: '0.9rem', boxSizing: 'border-box' }}
                  />
                </div>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ color: '#aaa', fontSize: '0.85rem', display: 'block', marginBottom: '4px' }}>Tag</label>
                  <input
                    value={tagNova}
                    onChange={(e) => setTagNova(e.target.value.toUpperCase())}
                    maxLength={5}
                    placeholder="Ex: ARES"
                    style={{ width: '150px', padding: '8px', background: '#0a0a1a', border: '1px solid #2a2a4a', borderRadius: '4px', color: '#ddd', fontSize: '0.9rem' }}
                  />
                </div>
                <button onClick={criarAlianca}
                  style={{ padding: '8px 20px', background: '#D4AF37', color: '#050E1A', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                  Criar Aliança
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
