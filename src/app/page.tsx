"use client";

import React, { useState, useEffect } from 'react';
import { useMotorJogo } from '@/hooks/useMotorJogo';
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
import { useToast } from '@/components/ToastProvider';
import { MISSOES } from '@/lib/missoes';
import Image from 'next/image';

export default function Inicio() {
  const {
    estado,
    agora,
    carregado,
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
    resetarJogo,
    pesquisar,
    temPesquisa,
    atacarAldeiaBarbar,
    trocarRecurso
  } = useMotorJogo();

  const { mostrarToast } = useToast();
  const [edificioSelecionado, setEdificioSelecionado] = useState<IdEdificio | null>(null);
  const [modalResetAberto, setModalResetAberto] = useState(false);
  const [modalMissoesAberto, setModalMissoesAberto] = useState(false);
  const [modalCombateAberto, setModalCombateAberto] = useState(false);

  // ─────────────────────────────────────────────────────────
  // UX-04: Exibir toast quando construção/recrutamento conclui
  // ─────────────────────────────────────────────────────────
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

  // Tela de carregamento
  if (!carregado) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: '#050E1A',
        color: '#D4AF37',
        fontFamily: 'var(--font-cinzel)',
        gap: '20px'
      }}>
        <div style={{ fontSize: '3rem', animation: 'spin 1.5s linear infinite' }}>🏛️</div>
        <h1 style={{ fontSize: '1.8rem', margin: 0 }}>Carregando Pólis...</h1>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const renda = calcularRenda(estado.edificios);

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
    if (!resultado.sucesso) {
      mostrarToast(resultado.motivo ?? 'Falhou ao lançar poder', 'erro', '❌');
    }
    return resultado;
  };

  const handleCancelarMelhoria = (i: number) => {
    cancelarMelhoria(i);
    mostrarToast('🔨 Construção cancelada. Recursos devolvidos.', 'aviso');
  };

  const handleCancelarRecrutamento = (i: number) => {
    cancelarRecrutamento(i);
    mostrarToast('🪖 Recrutamento cancelado. Recursos devolvidos.', 'aviso');
  };

  let missoesProntas = 0;
  const indexAtiva = MISSOES.findIndex(m => !estado.missoesColetadas.includes(m.id));
  if (indexAtiva !== -1) {
    if (MISSOES[indexAtiva].verificarConclusao(estado as any)) {
      missoesProntas = 1;
    }
  }

  return (
    <div id="app" className={edificioSelecionado ? 'modal-open' : ''}>
      <BarraSuperior
        recursos={estado.recursos}
        renda={renda}
        nomeCidade={estado.nomeCidade}
        aoAlterarNomeCidade={definirNomeCidade}
        aoResetar={() => setModalResetAberto(true)}
      />

      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', display: 'flex' }}>
        <ModalEdificioCidade
          edificios={estado.edificios}
          aoClicarEdificio={setEdificioSelecionado}
        />

        {/* Canto Esquerdo Superior: Missões */}
        <div style={{ position: 'absolute', left: '20px', top: '100px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
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
          resetarJogo();
          setModalResetAberto(false);
          mostrarToast('🏛️ Polis reiniciada. Boa sorte!', 'info');
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
                aoAtacar={atacarAldeiaBarbar}
                aomostrarToast={mostrarToast}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
