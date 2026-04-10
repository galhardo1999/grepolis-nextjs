"use client";

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { TAMANHO_MAXIMO_FILA_OBRAS } from '@/lib/config';
import { EDIFICIOS, IdEdificio } from '@/lib/edificios';
import { UNIDADES, IdUnidade } from '@/lib/unidades';
import { IdPesquisa } from '@/lib/pesquisas';
import { formatarTempo } from '@/lib/utils';
import { ModalEdificioRecrutamento } from './ModalEdificioRecrutamento';
import { ModalEdificioArmazem } from './ModalEdificioArmazem';
import { ModalEdificioAcademia } from './ModalEdificioAcademia';
import { ModalEdificioMercado } from './ModalEdificioMercado';
import { ResultadoBatalha } from '@/lib/combate';

function TooltipBox({ children, content, isDownwards = false, alignX = 'center' }: { children: React.ReactNode, content: React.ReactNode, isDownwards?: boolean, alignX?: 'center' | 'right' }) {
  const [hover, setHover] = useState(false);
  return (
    <div 
      style={{ position: 'relative', display: 'flex', flexDirection: 'column' }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {hover && (
        <div style={{
          position: 'absolute',
          ...(isDownwards ? { top: '100%', marginTop: '10px' } : { bottom: '100%', marginBottom: '10px' }),
          ...(alignX === 'right' ? { right: '-5px', left: 'auto', transform: 'none' } : { left: '50%', transform: 'translateX(-50%)' }),
          background: '#fadba6',
          border: '2px solid #ba965c',
          borderRadius: '4px',
          padding: '12px',
          width: '280px',
          color: '#2a1a0c',
          zIndex: 100,
          boxShadow: '0px 6px 12px rgba(0,0,0,0.6)',
          pointerEvents: 'none'
        }}>
          {content}
        </div>
      )}
      {children}
    </div>
  );
}

// FEAT-02 FIX: calcularTempoConstrucao agora vem do hook (única fonte de verdade)
// ARCH-03 FIX: registry pattern para modais especiais

interface ModalEdificioProps {
  aberto: boolean;
  aoFechar: () => void;
  idEdificio: IdEdificio | null;
  edificiosAtuais: Record<string, number>;
  fila: { edificio: IdEdificio; nivel: number; inicioTempo: number; fimTempo: number }[];
  aoMelhorar: (id: IdEdificio) => Promise<{ sucesso: boolean; motivo?: string }> | { sucesso: boolean; motivo?: string };
  calcularCustos: (id: IdEdificio, nivel: number) => { madeira: number; pedra: number; prata: number };
  calcularTempoConstrucao: (id: IdEdificio, nivel: number) => number;
  possuiRecursos: (custos: { madeira: number; pedra: number; prata: number }) => boolean;
  populacaoLivre: number;
  aoRecrutar?: (idUnidade: IdUnidade, quantidade: number) => Promise<{ sucesso: boolean; motivo?: string }> | { sucesso: boolean; motivo?: string };
  calcularTempoRecrutamento?: (idUnidade: IdUnidade, quantidade: number) => number;
  recursos: { madeira: number; pedra: number; prata: number; populacao: number; recursosMaximos: number; prataNaGruta?: number; };
  unidades: Record<string, number>;
  filaRecrutamento: { unidade: IdUnidade; quantidade: number; inicioTempo: number; fimTempo: number }[];
  renda?: { madeira: number; pedra: number; prata: number };
  pesquisasConcluidas: IdPesquisa[];
  aoPesquisar: (id: IdPesquisa) => Promise<{ sucesso: boolean; motivo?: string }> | { sucesso: boolean; motivo?: string };
  aoAtacarAldeiaBarbar: (idAldeia: string, exercito: Record<string, number>) => ResultadoBatalha | null;
  aoTrocarRecurso: (de: 'madeira' | 'pedra' | 'prata', para: 'madeira' | 'pedra' | 'prata', quantidade: number) => { sucesso: boolean; motivo?: string };
  agora: number;
  mostrarToast?: (msg: React.ReactNode, tipo?: 'sucesso' | 'erro' | 'info' | 'aviso', icone?: React.ReactNode) => void;
}

// Edifícios que usam modal de recrutamento
const MODAL_RECRUTAMENTO: IdEdificio[] = ['quartel'];
// Edifícios que usam modal naval (recrutamento naval + combate)
const MODAL_NAVAL: IdEdificio[] = ['porto'];
// Edifícios que usam modal de academia
const MODAL_ACADEMIA: IdEdificio[] = ['academia'];
// Edifícios que usam modal de mercado
const MODAL_MERCADO: IdEdificio[] = ['mercado'];

export const ModalEdificio = React.memo(function ModalEdificio({
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
    if (!dados) return null;
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
        const infoReq = EDIFICIOS[reqEdificio];
        const nivelAtualReq = (edificiosAtuais[reqEdificio] || 0) + fila.filter(f => f.edificio === reqEdificio).length;
        if (nivelAtualReq < nivelReq) {
          requisitosAtendidos = false;
          reqsTexto.push(`${infoReq?.nome || idReq} (Nv. ${nivelReq})`);
        }
      }
    }

    const filaCheia = fila.length >= TAMANHO_MAXIMO_FILA_OBRAS;

    const handleMelhorar = async () => {
      const resultado = await aoMelhorar(id);
      if (!resultado.sucesso && resultado.motivo) {
        mostrarToast?.(resultado.motivo, 'erro');
      } else if (resultado.sucesso) {
        mostrarToast?.(
          `${dados.nome} Nv.${proximoNivel} em construção!`,
          'sucesso',
          <Image src={(dados as any).imagem || '/placeholder_building.png'} alt={dados.nome} width={24} height={24} style={{ borderRadius: '4px' }} />
        );
      }
    };

    return (
      <div key={id} className="building-card" style={{ position: 'relative' }}>
        {/* Ícone de informação com tooltip exclusivo para descrição */}
        <div style={{ position: 'absolute', top: '6px', right: '6px', zIndex: 10 }}>
          <TooltipBox alignX="right" isDownwards={id === 'senado'} content={
            <div style={{ fontSize: '0.85rem', lineHeight: '1.4', maxWidth: '220px', textAlign: 'center', color: '#3e2723' }}>
              <strong>{dados.nome}</strong><br/>
              <span style={{ color: '#5d4037', display: 'block', marginTop: '4px' }}>{dados.descricao}</span>
            </div>
          }>
            <div style={{
              width: '20px', height: '20px', borderRadius: '50%', background: '#6d4c41', color: '#f3e5ab', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 'bold', cursor: 'help', border: '1px solid #d4af37', boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
            }}>
              i
            </div>
          </TooltipBox>
        </div>

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
          </div>
        </div>

        <TooltipBox isDownwards={id === 'senado'} content={
          <div style={{ textAlign: 'left', fontFamily: 'Arial, sans-serif' }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '1.05rem', color: '#1a1a1a', borderBottom: '1px solid #c2a77a', paddingBottom: '4px' }}>
              {dados.nome} ({proximoNivel})
            </h3>
            
            {!nivelMaximoAtingido && (
              <>
                <div style={{ fontWeight: 'bold', marginBottom: '6px', fontSize: '0.85rem' }}>Custos de expansão</div>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '8px', fontSize: '0.85rem', flexWrap: 'wrap' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '2px', color: recursos.madeira < custos.madeira ? '#D32F2F' : 'inherit' }}><Image src="/icones/icone_madeira.png" width={16} height={16} alt=""/> {custos.madeira}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '2px', color: recursos.pedra < custos.pedra ? '#D32F2F' : 'inherit' }}><Image src="/icones/icone_pedra.png" width={16} height={16} alt=""/> {custos.pedra}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '2px', color: recursos.prata < custos.prata ? '#D32F2F' : 'inherit' }}><Image src="/icones/icone_prata.png" width={16} height={16} alt=""/> {custos.prata}</span>
                  {custoPop > 0 && <span style={{ display: 'flex', alignItems: 'center', gap: '2px', color: populacaoLivre < custoPop ? '#D32F2F' : 'inherit' }}><Image src="/icones/icone_populacao.png" width={16} height={16} alt=""/> {custoPop}</span>}
                </div>

                <div style={{ fontWeight: 'bold', marginBottom: '4px', fontSize: '0.85rem' }}>Tempo de expansão</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '10px', fontSize: '0.85rem' }}>
                  🕒 {formatarTempo(segundosTotais)}
                </div>
              </>
            )}

            {filaCheia && (
              <div style={{ marginBottom: '8px', fontSize: '0.85rem', color: '#1a1a1a' }}>Não é possível dar mais ordens.</div>
            )}

            {!requisitosAtendidos && (
              <div style={{ color: '#D32F2F', marginBottom: '4px', fontSize: '0.85rem' }}>
                <strong style={{ display: 'block', marginBottom: '2px' }}>Requisitos Ausentes:</strong> 
                {reqsTexto.join(', ')}
              </div>
            )}
          </div>
        }>
          <button
            className={`upgrade-btn ${nivelMaximoAtingido ? 'max-level-lightning' : ''}`}
            disabled={!temRecursos || !temPop || filaCheia || !requisitosAtendidos || nivelMaximoAtingido}
            onClick={handleMelhorar}
          >
            {nivelMaximoAtingido
              ? 'Nível Máximo'
              : filaCheia
                ? 'Fila Cheia'
                : !requisitosAtendidos
                  ? 'Requisitos Ausentes'
                  : proximoNivel === 1
                    ? 'Construir'
                    : `Melhorar para Nv. ${proximoNivel}`}
          </button>
        </TooltipBox>
      </div>
    );
  };

  // ──────────────────────────────────────────────────────────
  // Conteúdo especial para Gruta — mostra prata protegida
  // ──────────────────────────────────────────────────────────
  const renderizarGruta = () => {
    const nivelGruta = edificiosAtuais['gruta'] || 0;
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
        {renderizarCartaoEdificio('gruta')}
      </div>
    );
  };

  // ──────────────────────────────────────────────────────────
  // Conteúdo especial para Muralha — mostra bônus de defesa
  // ──────────────────────────────────────────────────────────
  const renderizarMuralha = () => {
    const nivelMuralha = edificiosAtuais['muralha'] || 0;
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
        {renderizarCartaoEdificio('muralha')}
      </div>
    );
  };

  // ──────────────────────────────────────────────────────────
  // Conteúdo do modal por tipo de edifício
  // ──────────────────────────────────────────────────────────
  const renderizarConteudo = () => {
    if (idEdificio === 'senado') {
      return (
        <div id="senado-arvore">
          <div className="senado-no senado-raiz">
            {renderizarCartaoEdificio('senado')}
          </div>

          <div className="tree-connector-main"></div>

          <div className="senado-colunas">
            <div className="senado-coluna">
              {renderizarCartaoEdificio('serraria')}
              <div className="tree-arrow">▼</div>
              {renderizarCartaoEdificio('mina-de-prata')}
              <div className="tree-arrow">▼</div>
              {renderizarCartaoEdificio('porto')}
            </div>

            <div className="senado-coluna">
              {renderizarCartaoEdificio('fazenda')}
              <div className="tree-arrow">▼</div>
              {renderizarCartaoEdificio('quartel')}
              <div className="tree-arrow">▼</div>
              {renderizarCartaoEdificio('academia')}
            </div>

            <div className="senado-coluna">
              {renderizarCartaoEdificio('pedreira')}
              <div className="tree-arrow">▼</div>
              {renderizarCartaoEdificio('templo')}
              <div className="tree-arrow">▼</div>
              {renderizarCartaoEdificio('muralha')}
            </div>

            <div className="senado-coluna">
              {renderizarCartaoEdificio('armazem')}
              <div className="tree-arrow">▼</div>
              {renderizarCartaoEdificio('mercado')}
              <div className="tree-arrow">▼</div>
              {renderizarCartaoEdificio('gruta')}
            </div>
          </div>
        </div>
      );
    }

    if (idEdificio === 'armazem' && renda) {
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
            nivelAcademia={edificiosAtuais['academia'] || 0}
            prata={recursos.prata}
            pesquisasConcluidas={pesquisasConcluidas}
            aoPesquisar={aoPesquisar}
            aoMostrarToast={mostrarToast}
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
          {renderizarCartaoEdificio(idEdificio)}
        </>
      );
    }

    if (MODAL_MERCADO.includes(idEdificio)) {
      return (
        <>
          <ModalEdificioMercado
            nivelMercado={edificiosAtuais['mercado'] || 0}
            recursos={recursos}
            aoTrocar={aoTrocarRecurso}
            mostrarToast={mostrarToast}
          />
          <hr style={{ margin: '20px 0', borderColor: '#3a5a8a' }} />
          {renderizarCartaoEdificio(idEdificio)}
        </>
      );
    }

    if (idEdificio === 'gruta') {
      return renderizarGruta();
    }

    if (idEdificio === 'muralha') {
      return renderizarMuralha();
    }

    // Genérico
    const dadosGeral = EDIFICIOS[idEdificio];
    return (
      <>
        <p>{dadosGeral?.descricao || 'Edifício não reconhecido'}</p>
        <br />
        <p><strong>Nv. Atual:</strong> {edificiosAtuais[idEdificio] || 0}</p>
        <hr />
        {renderizarCartaoEdificio(idEdificio)}
      </>
    );
  };

  const isWide = ['senado', 'armazem', 'quartel', 'academia', 'porto', 'mercado'].includes(idEdificio);

  return (
    <div id="modal-overlay" onClick={(e) => e.target === e.currentTarget && aoFechar()}>
      <div id="modal-container" className={isWide ? 'senado-wide' : ''}>
        <div id="modal-header">
          <h2 id="modal-title">{EDIFICIOS[idEdificio]?.nome || 'Edifício'}</h2>
          <button id="close-modal" onClick={aoFechar}>&times;</button>
        </div>
        <div id="modal-body">
          {renderizarConteudo()}
        </div>
      </div>
    </div>
  );
});
