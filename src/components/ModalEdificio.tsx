"use client";

import React, { useEffect } from 'react';
import Image from 'next/image';
import { TAMANHO_MAXIMO_FILA, TEMPO_CONSTRUCAO_EDIFICIOS } from '@/lib/config';
import { EDIFICIOS, IdEdificio } from '@/lib/edificios';
import { UNIDADES, IdUnidade } from '@/lib/unidades';
import { ModalEdificioRecrutamento } from './ModalEdificioRecrutamento';
import { ModalEdificioArmazem } from './ModalEdificioArmazem';

interface ModalEdificioProps {
  aberto: boolean;
  aoFechar: () => void;
  idEdificio: IdEdificio | null;
  edificiosAtuais: Record<string, number>;
  fila: { edificio: IdEdificio; nivel: number }[];
  aoMelhorar: (id: IdEdificio) => void;
  calcularCustos: (id: IdEdificio, nivel: number) => { madeira: number; pedra: number; prata: number };
  possuiRecursos: (custos: { madeira: number; pedra: number; prata: number }) => boolean;
  populacaoLivre: number;
  aoRecrutar?: (idUnidade: IdUnidade, quantidade: number) => { sucesso: boolean; motivo?: string };
  calcularTempoRecrutamento?: (idUnidade: IdUnidade, quantidade: number) => number;
  recursos: { madeira: number; pedra: number; prata: number; populacao: number; recursosMaximos: number; };
  unidades: Record<string, number>;
  filaRecrutamento: { unidade: IdUnidade; quantidade: number; inicioTempo: number; fimTempo: number }[];
  renda?: { madeira: number; pedra: number; prata: number };
}

function formatarTempo(segundos: number) {
  const h = Math.floor(segundos / 3600);
  const m = Math.floor((segundos % 3600) / 60);
  const s = Math.floor(segundos % 60);
  
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export function ModalEdificio({
  aberto,
  aoFechar,
  idEdificio,
  edificiosAtuais,
  fila,
  aoMelhorar,
  calcularCustos,
  possuiRecursos,
  populacaoLivre,
  aoRecrutar,
  calcularTempoRecrutamento,
  recursos,
  unidades,
  filaRecrutamento,
  renda
}: ModalEdificioProps) {
  useEffect(() => {
    const escListener = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && aberto) {
        aoFechar();
      }
    };
    window.addEventListener('keydown', escListener);
    return () => window.removeEventListener('keydown', escListener);
  }, [aberto, aoFechar]);

  if (!aberto || !idEdificio) return null;

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

    // Calcular tempo de construção
    const tempoBase = (dados as any).tempoBase || 60;
    const multTempo = (dados as any).multiplicadorTempo || 1.25;
    const baseTempo = tempoBase * Math.pow(multTempo, proximoNivel);
    const bonusSenado = 1 - ((edificiosAtuais['senate'] || 0) * 0.05);
    const segundosTotais = (baseTempo * bonusSenado) / TEMPO_CONSTRUCAO_EDIFICIOS;

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
        
        {(() => {
          const filaCheia = fila.length >= TAMANHO_MAXIMO_FILA;
          
          let requisitosAtendidos = true;
          let reqsTexto: string[] = [];
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

          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <button 
                className={`upgrade-btn ${nivelMaximoAtingido ? 'max-level-lightning' : ''}`} 
                disabled={!temRecursos || !temPop || filaCheia || !requisitosAtendidos || nivelMaximoAtingido} 
                onClick={() => aoMelhorar(id)}
              >
                {nivelMaximoAtingido ? "Nível Máximo" : filaCheia ? "Não é Possível" : !requisitosAtendidos ? "Requisitos Ausentes" : proximoNivel === 1 ? "Construir" : `Melhorar para Nv. ${proximoNivel}`}
              </button>
              {!requisitosAtendidos && (
                <small style={{ color: '#D32F2F', textAlign: 'center', fontSize: '0.75rem', marginTop: '2px' }}>
                  Requer: {reqsTexto.join(', ')}
                </small>
              )}
            </div>
          );
        })()}
      </div>
    );
  };

  return (
    <div id="modal-overlay" onClick={(e) => e.target === e.currentTarget && aoFechar()}>
      <div id="modal-container" className={(idEdificio === 'senate' || idEdificio === 'warehouse' || idEdificio === 'barracks') ? 'senate-wide' : ''}>
        <div id="modal-header">
          <h2 id="modal-title">{idEdificio === 'senate' ? 'Senado' : EDIFICIOS[idEdificio].nome}</h2>
          <button id="close-modal" onClick={aoFechar}>&times;</button>
        </div>
        <div id="modal-body">
          {idEdificio === 'senate' ? (
            <div id="senate-tree">
              <div className="senate-node senate-root">
                {renderizarCartaoEdificio('senate')}
              </div>
              
              <div className="tree-connector-main"></div>

              <div className="senate-columns">
                {/* Coluna 1: Madeira -> Prata -> Porto */}
                <div className="senate-column">
                  {renderizarCartaoEdificio('timber-camp')}
                  <div className="tree-arrow">▼</div>
                  {renderizarCartaoEdificio('silver-mine')}
                  <div className="tree-arrow">▼</div>
                  {renderizarCartaoEdificio('harbor')}
                </div>

                {/* Coluna 2: Quinta -> Quartel -> Academia */}
                <div className="senate-column">
                  {renderizarCartaoEdificio('farm')}
                  <div className="tree-arrow">▼</div>
                  {renderizarCartaoEdificio('barracks')}
                  <div className="tree-arrow">▼</div>
                  {renderizarCartaoEdificio('academy')}
                </div>

                {/* Coluna 3: Pedreira -> Templo -> Muralha */}
                <div className="senate-column">
                  {renderizarCartaoEdificio('quarry')}
                  <div className="tree-arrow">▼</div>
                  {renderizarCartaoEdificio('temple')}
                  <div className="tree-arrow">▼</div>
                  {renderizarCartaoEdificio('walls')}
                </div>

                {/* Coluna 4: Armazém -> Mercado -> Gruta */}
                <div className="senate-column">
                  {renderizarCartaoEdificio('warehouse')}
                  <div className="tree-arrow">▼</div>
                  {renderizarCartaoEdificio('market')}
                  <div className="tree-arrow">▼</div>
                  {renderizarCartaoEdificio('cave')}
                </div>
              </div>
            </div>
          ) : idEdificio === 'warehouse' && renda ? (
            <>
               <ModalEdificioArmazem 
                  recursos={recursos}
                  renda={renda}
                  nivelAtual={edificiosAtuais[idEdificio] || 0}
               />
               <hr style={{ margin: '20px 0', borderColor: '#8b4513' }} />
               {renderizarCartaoEdificio(idEdificio)}
            </>
          ) : idEdificio === 'barracks' ? (
            <ModalEdificioRecrutamento 
              unidades={unidades}
              fila={filaRecrutamento}
              aoRecrutar={aoRecrutar!}
              recursos={recursos}
              calcularTempoRecrutamento={calcularTempoRecrutamento!}
            />
          ) : (
            <>
              <p>{EDIFICIOS[idEdificio].descricao}</p>
              <br />
              <p><strong>Nv. Atual:</strong> {edificiosAtuais[idEdificio] || 0}</p>
              <hr />
              {renderizarCartaoEdificio(idEdificio)}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
