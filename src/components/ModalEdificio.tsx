"use client";

import React, { useEffect } from 'react';
import Image from 'next/image';
import { TAMANHO_MAXIMO_FILA } from '@/lib/config';
import { EDIFICIOS, IdEdificio } from '@/lib/edificios';
import { UNIDADES, IdUnidade } from '@/lib/unidades';
import { IdPesquisa } from '@/lib/pesquisas';
import { formatarTempo } from '@/lib/utils';
import { ModalEdificioRecrutamento } from './ModalEdificioRecrutamento';
import { ModalEdificioArmazem } from './ModalEdificioArmazem';
import { ModalEdificioAcademia } from './ModalEdificioAcademia';
import { ModalEdificioMercado } from './ModalEdificioMercado';
import { ModalCombate } from './ModalCombate';
import { ResultadoBatalha } from '@/lib/combate';

// FEAT-02 FIX: calcularTempoConstrucao agora vem do hook (única fonte de verdade)
// ARCH-03 FIX: registry pattern para modais especiais

interface ModalEdificioProps {
  aberto: boolean;
  aoFechar: () => void;
  idEdificio: IdEdificio | null;
  edificiosAtuais: Record<string, number>;
  fila: { edificio: IdEdificio; nivel: number; inicioTempo: number; fimTempo: number }[];
  aoMelhorar: (id: IdEdificio) => { sucesso: boolean; motivo?: string };
  calcularCustos: (id: IdEdificio, nivel: number) => { madeira: number; pedra: number; prata: number };
  calcularTempoConstrucao: (id: IdEdificio, nivel: number) => number;
  possuiRecursos: (custos: { madeira: number; pedra: number; prata: number }) => boolean;
  populacaoLivre: number;
  aoRecrutar?: (idUnidade: IdUnidade, quantidade: number) => { sucesso: boolean; motivo?: string };
  calcularTempoRecrutamento?: (idUnidade: IdUnidade, quantidade: number) => number;
  recursos: { madeira: number; pedra: number; prata: number; populacao: number; recursosMaximos: number; prataNaGruta?: number; };
  unidades: Record<string, number>;
  filaRecrutamento: { unidade: IdUnidade; quantidade: number; inicioTempo: number; fimTempo: number }[];
  renda?: { madeira: number; pedra: number; prata: number };
  pesquisasConcluidas: IdPesquisa[];
  aoPesquisar: (id: IdPesquisa) => { sucesso: boolean; motivo?: string };
  aoAtacarAldeiaBarbar: (exercito: Record<string, number>) => ResultadoBatalha | null;
  aoTrocarRecurso: (de: 'madeira' | 'pedra' | 'prata', para: 'madeira' | 'pedra' | 'prata', quantidade: number) => { sucesso: boolean; motivo?: string };
  agora: number;
  mostrarToast?: (msg: string, tipo?: 'sucesso' | 'erro' | 'info' | 'aviso', icone?: string) => void;
}

// Edifícios que usam modal de recrutamento
const MODAL_RECRUTAMENTO: IdEdificio[] = ['barracks'];
// Edifícios que usam modal naval (recrutamento naval + combate)
const MODAL_NAVAL: IdEdificio[] = ['harbor'];
// Edifícios que usam modal de academia
const MODAL_ACADEMIA: IdEdificio[] = ['academy'];
// Edifícios que usam modal de mercado
const MODAL_MERCADO: IdEdificio[] = ['market'];

export function ModalEdificio({
  aberto,
  aoFechar,
  idEdificio,
  edificiosAtuais,
  fila,
  aoMelhorar,
  calcularCustos,
  calcularTempoConstrucao,
  possuiRecursos,
  populacaoLivre,
  aoRecrutar,
  calcularTempoRecrutamento,
  recursos,
  unidades,
  filaRecrutamento,
  renda,
  pesquisasConcluidas,
  aoPesquisar,
  aoAtacarAldeiaBarbar,
  aoTrocarRecurso,
  agora,
  mostrarToast
}: ModalEdificioProps) {

  useEffect(() => {
    const escListener = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && aberto) aoFechar();
    };
    window.addEventListener('keydown', escListener);
    return () => window.removeEventListener('keydown', escListener);
  }, [aberto, aoFechar]);

  if (!aberto || !idEdificio) return null;

  // ──────────────────────────────────────────────────────────
  // Cartão de edifício reutilizável
  // ──────────────────────────────────────────────────────────
  const renderizarCartaoEdificio = (id: IdEdificio) => {
    const dados = EDIFICIOS[id];
    const nivelAtual = edificiosAtuais[id] || 0;
    const qtdPendente = fila.filter(f => f.edificio === id).length;
    const proximoNivel = nivelAtual + qtdPendente + 1;
    const custos = calcularCustos(id, proximoNivel);
    const custoPop = (dados as any).custoPop || 0;
    const temRecursos = possuiRecursos(custos);
    const temPop = populacaoLivre >= custoPop;
    const nivelMaximoAtingido = nivelAtual + qtdPendente >= (dados as any).nivelMaximo;

    // FEAT-01 FIX: usa calcularTempoConstrucao do hook — única fonte de verdade
    const segundosTotais = calcularTempoConstrucao(id, proximoNivel);

    // Verificar requisitos para exibição
    let requisitosAtendidos = true;
    const reqsTexto: string[] = [];
    if ('requisitos' in dados && dados.requisitos) {
      const reqs = dados.requisitos as Record<string, number>;
      for (const [idReq, nivelReq] of Object.entries(reqs)) {
        const reqEdificio = idReq as IdEdificio;
        const nivelAtualReq = (edificiosAtuais[reqEdificio] || 0) + fila.filter(f => f.edificio === reqEdificio).length;
        if (nivelAtualReq < nivelReq) {
          requisitosAtendidos = false;
          reqsTexto.push(`${EDIFICIOS[reqEdificio].nome} (Nv. ${nivelReq})`);
        }
      }
    }

    const filaCheia = fila.length >= TAMANHO_MAXIMO_FILA;

    const handleMelhorar = () => {
      const resultado = aoMelhorar(id);
      if (!resultado.sucesso && resultado.motivo) {
        mostrarToast?.(resultado.motivo, 'erro');
      } else if (resultado.sucesso) {
        mostrarToast?.(`🏗️ ${dados.nome} Nv.${proximoNivel} em construção!`, 'sucesso');
      }
    };

    return (
      <div key={id} className="building-card">
        <div className="building-card-main">
          <div className="building-image-container">
            <Image
              src={(dados as any).imagem || '/placeholder_building.png'}
              alt={dados.nome}
              width={80}
              height={80}
              className="building-card-image"
            />
          </div>
          <div className="info">
            <h4>{dados.nome} {nivelAtual >= (dados as any).nivelMaximo ? '(NV. MAX)' : `(Nv. ${nivelAtual})`}</h4>
            <p>{dados.descricao}</p>
            {!nivelMaximoAtingido && (
              <div className="costs">
                <small>
                  <Image src="/icon_wood.png" alt="Madeira" width={16} height={16} style={{ verticalAlign: 'middle' }} />{' '}
                  <span style={{ color: recursos.madeira < custos.madeira ? '#D32F2F' : 'inherit' }}>{custos.madeira}</span>{' '}

                  <Image src="/icon_stone.png" alt="Pedra" width={16} height={16} style={{ verticalAlign: 'middle' }} />{' '}
                  <span style={{ color: recursos.pedra < custos.pedra ? '#D32F2F' : 'inherit' }}>{custos.pedra}</span>{' '}

                  <Image src="/icon_silver.png" alt="Prata" width={16} height={16} style={{ verticalAlign: 'middle' }} />{' '}
                  <span style={{ color: recursos.prata < custos.prata ? '#D32F2F' : 'inherit' }}>{custos.prata}</span>{' '}

                  {custoPop > 0 && (
                    <>
                      <Image src="/icon_pop.png" alt="Pop" width={16} height={16} style={{ verticalAlign: 'middle' }} />{' '}
                      <span style={{ color: populacaoLivre < custoPop ? '#D32F2F' : 'inherit' }}>{custoPop}</span>{' '}
                    </>
                  )}

                  <span style={{ marginLeft: '8px', color: '#B8860B', fontWeight: 'bold' }}>
                    🕒 {formatarTempo(segundosTotais)}
                  </span>
                </small>
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <button
            className={`upgrade-btn ${nivelMaximoAtingido ? 'max-level-lightning' : ''}`}
            disabled={!temRecursos || !temPop || filaCheia || !requisitosAtendidos || nivelMaximoAtingido}
            onClick={handleMelhorar}
          >
            {nivelMaximoAtingido
              ? 'Nível Máximo'
              : filaCheia
                ? 'Não é Possível'
                : !requisitosAtendidos
                  ? 'Requisitos Ausentes'
                  : proximoNivel === 1
                    ? 'Construir'
                    : `Melhorar para Nv. ${proximoNivel}`}
          </button>
          {!requisitosAtendidos && (
            <small style={{ color: '#D32F2F', textAlign: 'center', fontSize: '0.75rem', marginTop: '2px' }}>
              Requer: {reqsTexto.join(', ')}
            </small>
          )}
        </div>
      </div>
    );
  };

  // ──────────────────────────────────────────────────────────
  // Conteúdo especial para Gruta — mostra prata protegida
  // ──────────────────────────────────────────────────────────
  const renderizarGruta = () => {
    const nivelGruta = edificiosAtuais['cave'] || 0;
    const protecao = nivelGruta * 200;
    return (
      <div>
        <div style={{
          background: 'linear-gradient(135deg, #0d1117, #1a1040)',
          border: '1px solid #4b0082',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '16px'
        }}>
          <h4 style={{ color: '#a78bfa', margin: '0 0 8px' }}>🕵️ Proteção da Gruta</h4>
          <p style={{ color: '#c9d1d9', margin: '0 0 8px', fontSize: '0.9rem' }}>
            A Gruta esconde prata de espiões e saques inimigos.
          </p>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#e2d5b0', fontSize: '0.9rem' }}>
            <span>🪙 Prata protegida atualmente:</span>
            <strong style={{ color: '#c0c0c0' }}>{protecao} por recurso</strong>
          </div>
          {nivelGruta < 10 && (
            <div style={{ color: '#666', fontSize: '0.8rem', marginTop: '6px' }}>
              Próximo nível: {(nivelGruta + 1) * 200} de prata protegida
            </div>
          )}
        </div>
        {renderizarCartaoEdificio('cave')}
      </div>
    );
  };

  // ──────────────────────────────────────────────────────────
  // Conteúdo especial para Muralha — mostra bônus de defesa
  // ──────────────────────────────────────────────────────────
  const renderizarMuralha = () => {
    const nivelMuralha = edificiosAtuais['walls'] || 0;
    const bonusDefesa = Math.round(nivelMuralha * 3);
    return (
      <div>
        <div style={{
          background: 'linear-gradient(135deg, #0a1628, #0f2040)',
          border: '1px solid #1e3a5f',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '16px'
        }}>
          <h4 style={{ color: '#60a5fa', margin: '0 0 8px' }}>🏰 Bônus de Defesa</h4>
          <p style={{ color: '#c9d1d9', margin: '0 0 8px', fontSize: '0.9rem' }}>
            A Muralha fornece bônus de defesa contra ataques inimigos.
          </p>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#e2d5b0', fontSize: '0.9rem' }}>
            <span>🛡️ Bônus de defesa atual:</span>
            <strong style={{ color: bonusDefesa > 0 ? '#4ade80' : '#888' }}>+{bonusDefesa}%</strong>
          </div>
          {nivelMuralha < 25 && (
            <div style={{ color: '#666', fontSize: '0.8rem', marginTop: '6px' }}>
              Próximo nível: +{(nivelMuralha + 1) * 3}% de defesa
            </div>
          )}
        </div>
        {renderizarCartaoEdificio('walls')}
      </div>
    );
  };

  // ──────────────────────────────────────────────────────────
  // Conteúdo do modal por tipo de edifício
  // ──────────────────────────────────────────────────────────
  const renderizarConteudo = () => {
    if (idEdificio === 'senate') {
      return (
        <div id="senate-tree">
          <div className="senate-node senate-root">
            {renderizarCartaoEdificio('senate')}
          </div>

          <div className="tree-connector-main"></div>

          <div className="senate-columns">
            <div className="senate-column">
              {renderizarCartaoEdificio('timber-camp')}
              <div className="tree-arrow">▼</div>
              {renderizarCartaoEdificio('silver-mine')}
              <div className="tree-arrow">▼</div>
              {renderizarCartaoEdificio('harbor')}
            </div>

            <div className="senate-column">
              {renderizarCartaoEdificio('farm')}
              <div className="tree-arrow">▼</div>
              {renderizarCartaoEdificio('barracks')}
              <div className="tree-arrow">▼</div>
              {renderizarCartaoEdificio('academy')}
            </div>

            <div className="senate-column">
              {renderizarCartaoEdificio('quarry')}
              <div className="tree-arrow">▼</div>
              {renderizarCartaoEdificio('temple')}
              <div className="tree-arrow">▼</div>
              {renderizarCartaoEdificio('walls')}
            </div>

            <div className="senate-column">
              {renderizarCartaoEdificio('warehouse')}
              <div className="tree-arrow">▼</div>
              {renderizarCartaoEdificio('market')}
              <div className="tree-arrow">▼</div>
              {renderizarCartaoEdificio('cave')}
            </div>
          </div>
        </div>
      );
    }

    if (idEdificio === 'warehouse' && renda) {
      return (
        <>
          <ModalEdificioArmazem
            recursos={recursos}
            renda={renda}
            nivelAtual={edificiosAtuais[idEdificio] || 0}
          />
          <hr style={{ margin: '20px 0', borderColor: '#8b4513' }} />
          {renderizarCartaoEdificio(idEdificio)}
        </>
      );
    }

    if (MODAL_RECRUTAMENTO.includes(idEdificio)) {
      return (
        <ModalEdificioRecrutamento
          unidades={unidades}
          fila={filaRecrutamento}
          aoRecrutar={aoRecrutar!}
          recursos={recursos}
          calcularTempoRecrutamento={calcularTempoRecrutamento!}
          agora={agora}
          mostrarToast={mostrarToast}
        />
      );
    }

    if (MODAL_ACADEMIA.includes(idEdificio)) {
      return (
        <>
          <ModalEdificioAcademia
            nivelAcademia={edificiosAtuais['academy'] || 0}
            prata={recursos.prata}
            pesquisasConcluidas={pesquisasConcluidas}
            aoPesquisar={aoPesquisar}
            aomostrarToast={mostrarToast}
          />
          <hr style={{ margin: '20px 0', borderColor: '#3a5a8a' }} />
          {renderizarCartaoEdificio(idEdificio)}
        </>
      );
    }

    if (MODAL_NAVAL.includes(idEdificio)) {
      return (
        <>
          {/* FEAT-06: Recrutamento Naval */}
          <ModalEdificioRecrutamento
            unidades={unidades}
            fila={filaRecrutamento}
            aoRecrutar={aoRecrutar!}
            recursos={recursos}
            calcularTempoRecrutamento={calcularTempoRecrutamento!}
            agora={agora}
            mostrarToast={mostrarToast}
            tipoFiltro="naval"
          />
          <hr style={{ margin: '20px 0', borderColor: '#7f1d1d' }} />
          {/* Combate */}
          <ModalCombate
            unidades={unidades}
            aoAtacar={aoAtacarAldeiaBarbar}
            aomostrarToast={mostrarToast}
          />
          <hr style={{ margin: '20px 0', borderColor: '#7f1d1d' }} />
          {renderizarCartaoEdificio(idEdificio)}
        </>
      );
    }

    if (MODAL_MERCADO.includes(idEdificio)) {
      return (
        <>
          <ModalEdificioMercado
            nivelMercado={edificiosAtuais['market'] || 0}
            recursos={recursos}
            aoTrocar={aoTrocarRecurso}
            mostrarToast={mostrarToast}
          />
          <hr style={{ margin: '20px 0', borderColor: '#3a5a8a' }} />
          {renderizarCartaoEdificio(idEdificio)}
        </>
      );
    }

    if (idEdificio === 'cave') {
      return renderizarGruta();
    }

    if (idEdificio === 'walls') {
      return renderizarMuralha();
    }

    // Genérico
    return (
      <>
        <p>{EDIFICIOS[idEdificio].descricao}</p>
        <br />
        <p><strong>Nv. Atual:</strong> {edificiosAtuais[idEdificio] || 0}</p>
        <hr />
        {renderizarCartaoEdificio(idEdificio)}
      </>
    );
  };

  const isWide = ['senate', 'warehouse', 'barracks', 'academy', 'harbor', 'market'].includes(idEdificio);

  return (
    <div id="modal-overlay" onClick={(e) => e.target === e.currentTarget && aoFechar()}>
      <div id="modal-container" className={isWide ? 'senate-wide' : ''}>
        <div id="modal-header">
          <h2 id="modal-title">{EDIFICIOS[idEdificio].nome}</h2>
          <button id="close-modal" onClick={aoFechar}>&times;</button>
        </div>
        <div id="modal-body">
          {renderizarConteudo()}
        </div>
      </div>
    </div>
  );
}
