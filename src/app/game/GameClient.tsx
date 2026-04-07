"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useMotorJogo } from '@/hooks/useMotorJogo';
import { useGameStore } from '@/store/gameStore';
import { BarraSuperior } from '@/components/BarraSuperior';
import { ModalEdificioCidade } from '@/components/ModalEdificioCidade';
import { FilaConstrucao } from '@/components/FilaConstrucao';
import { FilaRecrutamento } from '@/components/FilaRecrutamento';
import { ModalEdificio } from '@/components/ModalEdificio';
import { EDIFICIOS, IdEdificio } from '@/lib/edificios';
import { UNIDADES, IdUnidade } from '@/lib/unidades';
import { PoderDivino } from '@/components/PoderesDivinos';
import { PainelExercito } from '@/components/PainelExercito';
import { ModalConfirmacao } from '@/components/ModalConfirmacao';
import { ModalCombate } from '@/components/ModalCombate';
import { ModalMissoes } from '@/components/ModalMissoes';
import { MapaMundo } from '@/components/MapaMundo';
import { PainelAlianca } from '@/components/PainelAlianca';
import { PainelRanking } from '@/components/PainelRanking';
import { useToast } from '@/components/ToastProvider';
import { MISSOES } from '@/lib/missoes';
import Image from 'next/image';
import type { EstadoJogo, AuthSession } from './types';

export function GameClient({
  estadoInicial,
  usuario,
}: {
  estadoInicial: EstadoJogo;
  usuario: AuthSession;
}) {

  const {
    estado,
    agora,
    carregado,
    carregandoAcao,
    eventosConclusao,
    limparEventos,
    melhorarEdificio,
    cancelarMelhoria,
    calcularCustos,
    calcularRenda,
    calcularTempoConstrucao,
    possuiRecursos,
    selecionarDeus,
    recrutar,
    calcularTempoRecrutamento,
    cancelarRecrutamento,
    definirNomeCidade,
    lancarPoder,
    resetarJogoStore,
    pesquisar,
    temPesquisa,
    atacarAldeiaBarbar,
    trocarRecurso,
  } = useMotorJogo();

  const { mostrarToast } = useToast();
  const router = useRouter();
  const [edificioSelecionado, setEdificioSelecionado] = useState<IdEdificio | null>(null);
  const [modalResetAberto, setModalResetAberto] = useState(false);
  const [modalMissoesAberto, setModalMissoesAberto] = useState(false);
  const [modalCombateAberto, setModalCombateAberto] = useState(false);
  const [modalMapaAberto, setModalMapaAberto] = useState(false);
  const [modalAliancaAberto, setModalAliancaAberto] = useState(false);
  const [modalRankingAberto, setModalRankingAberto] = useState(false);

  // Streak
  const [loginStreak, setLoginStreak] = useState(0);
  const [streakRecompensa, setStreakRecompensa] = useState<Record<string, number> | null>(null);
  const [ataquesAlertas, setAtaquesAlertas] = useState<number>(0);
  const [showStreakModal, setShowStreakModal] = useState(false);

  // ───────────────────────────────────────────────────────
  // UX-04: Exibir toast quando construção/recrutamento conclui
  // ───────────────────────────────────────────────────────
  useEffect(() => {
    if (eventosConclusao.length === 0) return;
    for (const evento of eventosConclusao) {
      if (evento.tipo === 'edificio') {
        const imagem = (EDIFICIOS[evento.id as IdEdificio] as any)?.imagem || '/placeholder_building.png';
        mostrarToast(
          `${evento.nome} Nv.${evento.nivel} concluído!`,
          'sucesso',
          <Image src={imagem} alt={evento.nome} width={24} height={24} style={{ borderRadius: '4px' }} />
        );
      } else if (evento.tipo === 'unidade') {
        const imagem = (UNIDADES[evento.id as IdUnidade] as any)?.retrato || '/placeholder.png';
        mostrarToast(
          `${evento.quantidade}x ${evento.nome} prontos!`,
          'sucesso',
          <Image src={imagem} alt={evento.nome} width={24} height={24} style={{ borderRadius: '4px' }} />
        );
      }
    }
    limparEventos();
  }, [eventosConclusao, limparEventos, mostrarToast]);

  const estadoRef = useRef(estado);
  useEffect(() => {
    estadoRef.current = estado;
  }, [estado]);

  // ─── Login Streak ──────────────────────────────────────
  useEffect(() => {
    if (!carregado) return;
    fetch('/api/game/streak', { method: 'POST' })
      .then(r => r.json())
      .then(data => {
        if (data.streak) {
          setLoginStreak(data.streak);
          if (data.rewardsApplied) {
            setStreakRecompensa(data.rewardsApplied);
            setShowStreakModal(true);
            mostrarToast(`🔥 Login streak: Dia ${data.streak}!`, 'sucesso');
          }
        }
      })
      .catch(() => { });
  }, [carregado, mostrarToast]);

  // ─── Verificar ataques entrantes ────────────────────────
  useEffect(() => {
    if (!carregado) return;
    const checkAtaques = async () => {
      try {
        const res = await fetch('/api/game/ataque');
        if (res.ok) {
          const data = await res.json();
          setAtaquesAlertas((data.ataquesRecebidos || []).length);
          // Processar ataques chegados
          if ((data.ataquesRecebidos || []).length > 0 || (data.ataquesEnviados || []).length > 0) {
            await fetch('/api/game/relatorios', { method: 'POST' });
          }
        }
      } catch { }
    };
    checkAtaques();
    const timer = setInterval(checkAtaques, 60000); // check a cada 1min
    return () => clearInterval(timer);
  }, [carregado, mostrarToast]);

  // ─── Save status ──────────────────────────────────────
  const [statusSave, setStatusSave] = useState<'salvo' | 'salvando' | 'erro'>('salvo');

  const salvarNoServidor = useCallback(async () => {
    setStatusSave('salvando');
    try {
      const res = await fetch('/api/game/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ultimaAtualizacao: Date.now() }),
      });
      if (!res.ok) throw new Error('Sync falhou');
      setStatusSave('salvo');
    } catch {
      setStatusSave('erro');
      // Recupera automaticamente no proximo tick
      setTimeout(() => setStatusSave('salvo'), 10_000);
    }
  }, []);

  // Auto-save a cada 30 segundos (reduz requests desnecessarios)
  useEffect(() => {
    if (!carregado) return;
    const timer = setInterval(() => {
      salvarNoServidor();
    }, 30_000);
    return () => clearInterval(timer);
  }, [carregado, salvarNoServidor]);

  // Salvar antes de sair (F5, fechar aba, navigation)
  useEffect(() => {
    const onBeforeUnload = () => {
      // Envia payload vazio — o servidor recalcula o estado baseado em tempo decorrido
      navigator.sendBeacon('/api/game/sync', JSON.stringify({}));
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, []);

  // Salvar após cada evento de conclusão
  useEffect(() => {
    if (eventosConclusao.length > 0) {
      salvarNoServidor();
    }
  }, [eventosConclusao, salvarNoServidor]);

  // Sync ao montar — acessa Zustand diretamente para evitar
  // problemas de hidratação com persist middleware
  useEffect(() => {
    useGameStore.setState({
      recursos: estadoInicial.recursos,
      edificios: estadoInicial.edificios,
      unidades: estadoInicial.unidades,
      pesquisasConcluidas: estadoInicial.pesquisasConcluidas,
      missoesColetadas: estadoInicial.missoesColetadas,
      fila: estadoInicial.fila,
      filaRecrutamento: estadoInicial.filaRecrutamento,
      cooldownsAldeias: estadoInicial.cooldownsAldeias,
      deusAtual: estadoInicial.deusAtual,
      nomeCidade: estadoInicial.nomeCidade,
      ultimaAtualizacao: estadoInicial.ultimaAtualizacao,
    });
  }, []);

  // Tela de carregamento
  if (!carregado) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
        alignItems: 'center', height: '100vh', background: '#050E1A',
        color: '#D4AF37', fontFamily: 'var(--font-cinzel)', gap: '20px'
      }}>
        <div className="loading-icon" style={{ animation: 'spin 1.5s linear infinite' }}>
          <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
            <path d="M32 4L12 20v28h40V20L32 4zm0 6l14 11.5v0H18L32 10z" fill="#D4AF37" stroke="#998030" strokeWidth="1.5" />
            <rect x="24" y="30" width="16" height="18" rx="1" fill="#D4AF37" stroke="#998030" strokeWidth="1" />
            <circle cx="32" cy="18" r="3" fill="#050E1A" />
            <path d="M8 24h4v24H8zM52 24h4v24h-4z" fill="#D4AF37" stroke="#998030" strokeWidth="1" />
          </svg>
        </div>
        <h1 style={{ fontSize: '1.8rem', margin: 0 }}>Carregando Pólis...</h1>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const renda = calcularRenda(estado.edificios);

  // Indicador de status de sync — canto inferior direito
  const saveIndicator = statusSave === 'salvando'
    ? { label: 'Sincronizando...', color: '#facc15' }
    : statusSave === 'erro'
      ? { label: 'Sync falhou — reconectando', color: '#f87171' }
      : { label: '✓ Salvo', color: '#4ade80' };

  const handleSelecionarDeus = (idDeus: Parameters<typeof selecionarDeus>[0]) => {
    const res = selecionarDeus(idDeus);
    if (res && typeof res === 'object' && !res.sucesso) {
      mostrarToast(res.motivo || 'Erro ao selecionar deus', 'erro', '❌');
    } else {
      mostrarToast(`⚡ ${idDeus.toUpperCase()} se torna seu divino protetor!`, 'sucesso');
    }
  };

  const handleLancarPoder = (idPoder: string) => {
    const resultado = lancarPoder(idPoder);
    if (resultado.sucesso) {
      // Persist cooldown state to server immediately
      salvarNoServidor();
    } else {
      mostrarToast(resultado.motivo ?? 'Falhou ao lançar poder', 'erro', '❌');
    }
    return resultado;
  };

  const handleCancelarMelhoria = async (i: number) => {
    await cancelarMelhoria(i);
    mostrarToast('🔨 Construção cancelada. Recursos devolvidos.', 'sucesso', '⚠️');
  };

  const handleCancelarRecrutamento = async (i: number) => {
    await cancelarRecrutamento(i);
    mostrarToast('🪖 Recrutamento cancelado. Recursos devolvidos.', 'sucesso', '⚠️');
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  let missoesProntas = 0;
  const indexAtiva = MISSOES.findIndex(m => !estado.missoesColetadas.includes(m.id));
  if (indexAtiva !== -1) {
    if (MISSOES[indexAtiva].verificarConclusao(estado as any)) {
      missoesProntas = 1;
    }
  }

  return (
    <div id="app" className={edificioSelecionado || modalMapaAberto || modalAliancaAberto || modalRankingAberto ? 'modal-open' : ''}>
      <BarraSuperior
        recursos={estado.recursos}
        renda={renda}
        nomeCidade={estado.nomeCidade}
        aoAlterarNomeCidade={definirNomeCidade}
        aoResetar={() => setModalResetAberto(true)}
        aoLogout={handleLogout}
      />

      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', display: 'flex' }}>
        <ModalEdificioCidade
          edificios={estado.edificios}
          aoClicarEdificio={setEdificioSelecionado}
        />

        {/* Canto Esquerdo Superior: Navegacao */}
        <div style={{ position: 'absolute', left: '20px', top: '80px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div onClick={() => setModalMapaAberto(true)} style={{
            background: 'linear-gradient(135deg, rgba(10, 40, 20, 0.9), rgba(10, 22, 40, 0.9))', border: '2px solid #D4AF37', borderRadius: '8px', padding: '10px 15px', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 4px 10px rgba(0,0,0,0.5)', transition: 'all 0.2s', backdropFilter: 'blur(5px)'
          }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            <div style={{ fontSize: '2.2rem', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }}>🗺️</div>
            <div>
              <div style={{ fontWeight: 'bold', fontFamily: 'var(--font-heading)', color: '#D4AF37', fontSize: '1.1rem', letterSpacing: '1px' }}>Mapa</div>
              <div style={{ color: '#aaa', fontSize: '0.85rem' }}>Ver mundo</div>
            </div>
          </div>

          <div onClick={() => setModalAliancaAberto(true)} style={{
            background: 'linear-gradient(135deg, rgba(40, 40, 10, 0.9), rgba(10, 22, 40, 0.9))', border: '2px solid #D4AF37', borderRadius: '8px', padding: '10px 15px', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 4px 10px rgba(0,0,0,0.5)', transition: 'all 0.2s', backdropFilter: 'blur(5px)'
          }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            <div style={{ fontSize: '2.2rem', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }}>👥</div>
            <div>
              <div style={{ fontWeight: 'bold', fontFamily: 'var(--font-heading)', color: '#D4AF37', fontSize: '1.1rem', letterSpacing: '1px' }}>Alianças</div>
              <div style={{ color: '#aaa', fontSize: '0.85rem' }}>Social</div>
            </div>
          </div>

          <div onClick={() => setModalRankingAberto(true)} style={{
            background: 'linear-gradient(135deg, rgba(60, 50, 10, 0.9), rgba(10, 22, 40, 0.9))', border: '2px solid #D4AF37', borderRadius: '8px', padding: '10px 15px', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 4px 10px rgba(0,0,0,0.5)', transition: 'all 0.2s', backdropFilter: 'blur(5px)'
          }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            <div style={{ fontSize: '2.2rem', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }}>🏆</div>
            <div>
              <div style={{ fontWeight: 'bold', fontFamily: 'var(--font-heading)', color: '#D4AF37', fontSize: '1.1rem', letterSpacing: '1px' }}>Ranking</div>
              <div style={{ color: '#aaa', fontSize: '0.85rem' }}>Leaderboard</div>
            </div>
          </div>

          <div onClick={() => setModalMissoesAberto(true)} style={{
            background: 'linear-gradient(135deg, rgba(26, 16, 64, 0.9), rgba(10, 22, 40, 0.9))', border: '2px solid #D4AF37', borderRadius: '8px', padding: '10px 15px', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 4px 10px rgba(0,0,0,0.5)', transition: 'all 0.2s', backdropFilter: 'blur(5px)'
          }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            <div style={{ fontSize: '2.2rem', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }}>📜</div>
            <div>
              <div style={{ fontWeight: 'bold', fontFamily: 'var(--font-heading)', color: '#D4AF37', fontSize: '1.1rem', letterSpacing: '1px' }}>Missões</div>
              {missoesProntas > 0 ? (
                <div style={{ color: '#4ade80', fontSize: '0.85rem', fontWeight: 'bold' }}>{missoesProntas} Pronta(s)!</div>
              ) : (
                <div style={{ color: '#aaa', fontSize: '0.85rem' }}>Ver tarefas</div>
              )}
            </div>
            {missoesProntas > 0 && (
              <div style={{ position: 'absolute', top: '-8px', right: '-8px', background: '#e11d48', color: '#fff', fontSize: '0.75rem', fontWeight: 'bold', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #fff', boxShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                {missoesProntas}
              </div>
            )}
          </div>

          <div onClick={() => setModalCombateAberto(true)} style={{
            background: 'linear-gradient(135deg, rgba(60, 20, 20, 0.9), rgba(40, 10, 10, 0.9))', border: '2px solid #D4AF37', borderRadius: '8px', padding: '10px 15px', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 4px 10px rgba(0,0,0,0.5)', transition: 'all 0.2s', backdropFilter: 'blur(5px)'
          }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            <div style={{ fontSize: '2.2rem', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }}>🏕️</div>
            <div>
              <div style={{ fontWeight: 'bold', fontFamily: 'var(--font-heading)', color: '#D4AF37', fontSize: '1.1rem', letterSpacing: '1px' }}>Aldeias</div>
              <div style={{ color: '#aaa', fontSize: '0.85rem' }}>Saquear bárbaros</div>
            </div>
          </div>

          {/* Alerta de ataques */}
          {ataquesAlertas > 0 && (
            <div style={{
              background: 'linear-gradient(135deg, rgba(120, 20, 20, 0.95), rgba(80, 10, 10, 0.95))',
              border: '2px solid #f87171', borderRadius: '8px', padding: '10px 15px', color: '#f87171',
              display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer',
              boxShadow: '0 4px 20px rgba(248,113,113,0.3)', animation: 'pulse 1.5s ease-in-out infinite',
            }}>
              <div style={{ fontSize: '2.2rem' }}>⚠️</div>
              <div>
                <div style={{ fontWeight: 'bold', fontFamily: 'var(--font-heading)', fontSize: '1rem' }}>
                  {ataquesAlertas} Ataque(s)!
                </div>
                <div style={{ color: '#fbbf24', fontSize: '0.8rem' }}>Seus relatórios aguardam</div>
              </div>
            </div>
          )}
        </div>

        <div style={{
          position: 'absolute', right: '20px', top: '100px',
          display: 'flex', flexDirection: 'column', gap: '40px', alignItems: 'flex-end'
        }}>
          <PoderDivino
            idDeusAtual={estado.deusAtual}
            favor={estado.recursos.favor}
            favorMaximo={estado.recursos.favorMaximo}
            nivelTemplo={estado.edificios['temple'] || 0}
            aoSelecionarDeus={handleSelecionarDeus}
            aoLancarPoder={handleLancarPoder}
          />
          <PainelExercito unidades={estado.unidades} />
        </div>

        {/* Streak badge */}
        <div style={{
          position: 'absolute', right: '20px', bottom: '60px',
          background: 'linear-gradient(135deg, rgba(26, 16, 64, 0.9), rgba(10, 22, 40, 0.9))',
          border: '2px solid #D4AF37', borderRadius: '8px', padding: '6px 12px',
          color: '#D4AF37', fontSize: '0.8rem', fontWeight: 'bold',
          boxShadow: '0 4px 10px rgba(0,0,0,0.5)',
        }}>
          🔥 {loginStreak} dia(s)
        </div>

        {/* Filas inferiores */}
        <div id="bottom-queues">
          <FilaConstrucao
            fila={estado.fila}
            agora={agora}
            aoCancelar={handleCancelarMelhoria}
          />
          <FilaRecrutamento
            fila={estado.filaRecrutamento}
            agora={agora}
            aoCancelar={handleCancelarRecrutamento}
          />
        </div>
      </div>

      {/* Modal de edifício */}
      <ModalEdificio
        aberto={!!edificioSelecionado}
        aoFechar={() => setEdificioSelecionado(null)}
        idEdificio={edificioSelecionado}
        edificiosAtuais={estado.edificios}
        fila={estado.fila}
        aoMelhorar={melhorarEdificio}
        calcularCustos={calcularCustos}
        calcularTempoConstrucao={calcularTempoConstrucao}
        possuiRecursos={possuiRecursos}
        populacaoLivre={estado.recursos.populacao}
        aoRecrutar={recrutar}
        calcularTempoRecrutamento={calcularTempoRecrutamento}
        recursos={estado.recursos as any}
        unidades={estado.unidades}
        filaRecrutamento={estado.filaRecrutamento}
        renda={renda}
        pesquisasConcluidas={estado.pesquisasConcluidas}
        aoPesquisar={pesquisar}
        aoAtacarAldeiaBarbar={atacarAldeiaBarbar}
        aoTrocarRecurso={trocarRecurso}
        agora={agora}
        mostrarToast={mostrarToast}
      />

      {/* Modal de confirmação de reset */}
      <ModalConfirmacao
        aberto={modalResetAberto}
        titulo="Resetar Polis?"
        mensagem="Isso apagará TODO o seu progresso permanentemente — edifícios, tropas, pesquisas e recursos. Esta ação não pode ser desfeita."
        textoBotaoConfirmar="Sim, resetar tudo"
        textoBotaoCancelar="Cancelar"
        tipo="perigo"
        aoConfirmar={() => {
          resetarJogoStore();
          setModalResetAberto(false);
          mostrarToast('🏛️ Polis reiniciada. Boa sorte!', 'info');
          salvarNoServidor();
        }}
        aoCancelar={() => setModalResetAberto(false)}
      />

      {/* Modal de Missões */}
      <ModalMissoes
        aberto={modalMissoesAberto}
        aoFechar={() => setModalMissoesAberto(false)}
      />

      {/* Modal de Combate */}
      {modalCombateAberto && (
        <div id="modal-overlay" onClick={(e) => e.target === e.currentTarget && setModalCombateAberto(false)}>
          <div id="modal-container" className="senate-wide" style={{ width: '800px' }}>
            <div id="modal-header">
              <h2 id="modal-title">🏕️ Aldeias Bárbaras</h2>
              <button id="close-modal" onClick={() => setModalCombateAberto(false)}>&times;</button>
            </div>
            <div id="modal-body">
              <ModalCombate
                unidades={estado.unidades}
                cooldownsAldeias={estado.cooldownsAldeias}
                agora={agora}
                aoAtacar={atacarAldeiaBarbar}
                aomostrarToast={mostrarToast}
                nomeCidade={estado.nomeCidade}
              />
            </div>
          </div>
        </div>
      )}

      {/* Modal Mapa do Mundo */}
      <MapaMundo
        aberto={modalMapaAberto}
        aoFechar={() => setModalMapaAberto(false)}
        aoClicarCidade={() => {}}
      />

      {/* Modal Aliança */}
      <PainelAlianca
        aberto={modalAliancaAberto}
        aoFechar={() => setModalAliancaAberto(false)}
      />

      {/* Modal Ranking */}
      <PainelRanking
        aberto={modalRankingAberto}
        aoFechar={() => setModalRankingAberto(false)}
      />

      {/* Modal Login Streak */}
      {showStreakModal && streakRecompensa && (
        <div id="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowStreakModal(false)}>
          <div id="modal-container" style={{ width: '350px' }}>
            <div id="modal-header">
              <h2 id="modal-title">🔥 Login Streak: Dia {loginStreak}</h2>
              <button id="close-modal" onClick={() => setShowStreakModal(false)}>&times;</button>
            </div>
            <div id="modal-body" style={{ textAlign: 'center', padding: '20px' }}>
              <div style={{ fontSize: '3rem', marginBottom: '15px' }}>🎁</div>
              <p style={{ color: '#D4AF37', fontSize: '1rem' }}>Recompensas do dia:</p>
              <div style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px',
                background: '#0a0a1a', borderRadius: '8px', padding: '15px', marginBottom: '15px',
              }}>
                <div><span style={{ color: '#8B4513' }}>Madeira</span><br/><strong style={{ color: '#4ade80' }}>+{streakRecompensa.madeira}</strong></div>
                <div><span style={{ color: '#888' }}>Pedra</span><br/><strong style={{ color: '#4ade80' }}>+{streakRecompensa.pedra}</strong></div>
                <div><span style={{ color: '#aaa' }}>Prata</span><br/><strong style={{ color: '#4ade80' }}>+{streakRecompensa.prata}</strong></div>
                <div><span style={{ color: '#D4AF37' }}>Favor</span><br/><strong style={{ color: '#4ade80' }}>+{streakRecompensa.favor}</strong></div>
              </div>
              {streakRecompensa.bonusEspecial && (
                <div style={{ color: '#FFD700', fontWeight: 'bold' }}>✨ Especial: {streakRecompensa.bonusEspecial}</div>
              )}
              <button onClick={() => setShowStreakModal(false)}
                style={{ padding: '8px 24px', background: '#D4AF37', color: '#050E1A', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', marginTop: '10px' }}>
                Coletar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Indicador de status de sync */}
      <div style={{
        position: 'fixed', bottom: '12px', right: '20px',
        fontSize: '0.75rem', color: saveIndicator.color,
        opacity: 0.8, fontFamily: 'var(--font-inter)',
        textAlign: 'right', pointerEvents: 'none',
      }}>
        <span style={{
          display: 'inline-block',
          width: '6px', height: '6px',
          borderRadius: '50%',
          backgroundColor: saveIndicator.color,
          marginRight: '6px',
          opacity: statusSave === 'salvando' ? 0.4 : 1,
          animation: statusSave === 'salvando' ? 'pulse 1s ease-in-out infinite' : 'none',
        }} />
        {saveIndicator.label}
      </div>
      <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }`}</style>
    </div>
  );
}
