"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { UNIDADES, IdUnidade } from '@/lib/unidades';
import { formatarTempoRelogio } from '@/lib/utils';

// PERF-02 FIX: agora recebe `agora` do motor — sem setInterval de UI local

interface ModalEdificioRecrutamentoProps {
  unidades: Record<string, number>;
  fila: { unidade: IdUnidade; quantidade: number; inicioTempo: number; fimTempo: number }[];
  aoRecrutar: (idUnidade: IdUnidade, quantidade: number) => { sucesso: boolean; motivo?: string };
  recursos: { madeira: number; pedra: number; prata: number; populacao: number };
  calcularTempoRecrutamento: (idUnidade: IdUnidade, quantidade: number) => number;
  agora: number;
  mostrarToast?: (msg: string, tipo?: 'sucesso' | 'erro' | 'info' | 'aviso', icone?: string) => void;
  tipoFiltro?: 'terrestre' | 'naval';
}

export function ModalEdificioRecrutamento({
  unidades,
  fila,
  aoRecrutar,
  recursos,
  calcularTempoRecrutamento,
  agora,
  mostrarToast,
  tipoFiltro = 'terrestre'
}: ModalEdificioRecrutamentoProps) {
  const listaUnidades = (Object.keys(UNIDADES) as IdUnidade[]).filter(id => UNIDADES[id].tipo === tipoFiltro);
  const [unidadeSelecionada, setUnidadeSelecionada] = useState<IdUnidade>(listaUnidades[0] || 'swordsman');
  const [qtd, setQtd] = useState<number>(0);

  const getMaxRecrutavel = (id: IdUnidade) => {
    const c = UNIDADES[id].custos;
    const maxM = c.madeira > 0 ? Math.floor(recursos.madeira / c.madeira) : Infinity;
    const maxPe = c.pedra > 0 ? Math.floor(recursos.pedra / c.pedra) : Infinity;
    const maxPr = c.prata > 0 ? Math.floor(recursos.prata / c.prata) : Infinity;
    const maxPo = c.populacao > 0 ? Math.floor(recursos.populacao / c.populacao) : Infinity;
    return Math.max(0, Math.min(maxM, maxPe, maxPr, maxPo));
  };

  useEffect(() => {
    const max = getMaxRecrutavel(unidadeSelecionada);
    if (qtd > max) setQtd(max);
  }, [recursos, unidadeSelecionada]);

  const selecionada = UNIDADES[unidadeSelecionada];
  const maxUnidadeSelecionada = getMaxRecrutavel(unidadeSelecionada);

  const handleRecrutar = () => {
    if (qtd > 0 && qtd <= maxUnidadeSelecionada) {
      const resultado = aoRecrutar(unidadeSelecionada, qtd);
      if (resultado.sucesso) {
        mostrarToast?.(`🪖 ${qtd}x ${selecionada.nome} em treinamento!`, 'sucesso');
        setQtd(0);
      } else {
        mostrarToast?.(resultado.motivo ?? 'Erro ao recrutar', 'erro');
      }
    }
  };

  const currentOwned = (id: IdUnidade) => unidades[id] || 0;

  return (
    <div className="quartel-container" style={{ fontFamily: 'Arial, sans-serif', color: '#000', padding: '10px' }}>

      {/* Grade de unidades disponíveis */}
      <div style={{ display: 'flex', gap: '4px', borderBottom: '2px solid #a67c52', paddingBottom: '15px', marginBottom: '15px' }}>
        {listaUnidades.map(id => {
          const u = UNIDADES[id];
          const isSelected = id === unidadeSelecionada;
          const max = getMaxRecrutavel(id);
          const owned = currentOwned(id);

          return (
            <div
              key={id}
              onClick={() => { setUnidadeSelecionada(id); setQtd(0); }}
              title={`${u.nome}\n⚔️ ATQ: ${u.ataque} | 🛡️ DEF: ${u.defesa}\n🚀 VEL: ${u.velocidade}`}
              style={{
                width: '60px', cursor: 'pointer',
                border: isSelected ? '2px solid #5a8bd6' : '1px solid #7c5e3d',
                background: '#ffebcd', textAlign: 'center',
                boxShadow: isSelected ? '0 0 5px #5a8bd6' : 'none'
              }}
            >
              <div style={{ background: '#ffdead', borderBottom: '1px solid #7c5e3d', fontWeight: 'bold', fontSize: '13px', padding: '2px 0' }}>
                {owned}
              </div>
              <div style={{ position: 'relative', height: '60px' }}>
                <Image src={u.retrato} alt={u.nome} fill style={{ objectFit: 'cover' }} />
                <div style={{
                  position: 'absolute', bottom: '2px', right: '2px',
                  color: '#fff', textShadow: '1px 1px 2px #000, -1px -1px 2px #000',
                  fontWeight: 'bold', fontSize: '12px'
                }}>
                  {owned}
                </div>
              </div>
              <div style={{ background: '#ffdead', borderTop: '1px solid #7c5e3d', fontWeight: 'bold', fontSize: '12px', padding: '2px 0' }}>
                +{max}
              </div>
            </div>
          );
        })}
      </div>

      {/* Painel central */}
      <div style={{ display: 'flex', gap: '20px' }}>

        {/* Esquerda: controles de recrutamento */}
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 'bold', fontSize: '16px', marginBottom: '5px' }}>
            {selecionada.nome}
          </div>
          {/* Stats */}
          <div style={{ fontSize: '11px', color: '#555', marginBottom: '6px', display: 'flex', gap: '12px' }}>
            <span>⚔️ ATQ: {selecionada.ataque}</span>
            <span>🛡️ DEF: {selecionada.defesa}</span>
            <span>🚀 VEL: {selecionada.velocidade}</span>
            <span>📦 Carga: {selecionada.capacidadeTransporte}</span>
          </div>
          <div style={{ display: 'flex', gap: '10px', background: '#dcb87d', border: '2px solid #8b5a2b', padding: '4px', borderRadius: '4px' }}>
            <div style={{ width: '100px', height: '100px', position: 'relative', border: '2px solid #a67538' }}>
              <Image src={selecionada.retrato} alt={selecionada.nome} fill style={{ objectFit: 'cover' }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '10px', flex: 1 }}>
              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ background: '#0a1d3a', color: '#ffb74d', border: '2px solid #ffb74d', padding: '2px 15px', fontWeight: 'bold' }}>
                  0
                </div>
                <div style={{ background: '#0a1d3a', color: '#ffb74d', border: '2px solid #ffb74d', padding: '2px 15px', fontWeight: 'bold' }}>
                  {maxUnidadeSelecionada}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%' }}>
                <button onClick={() => setQtd(Math.max(0, qtd - 1))} style={{ background: '#0a1d3a', color: '#ffb74d', border: '1px solid #ffb74d', cursor: 'pointer', padding: '2px 5px' }}>◀</button>
                <input
                  type="range" min="0" max={maxUnidadeSelecionada} value={qtd}
                  onChange={(e) => setQtd(parseInt(e.target.value))}
                  style={{ flex: 1 }}
                />
                <button onClick={() => setQtd(Math.min(maxUnidadeSelecionada, qtd + 1))} style={{ background: '#0a1d3a', color: '#ffb74d', border: '1px solid #ffb74d', cursor: 'pointer', padding: '2px 5px' }}>▶</button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input
                  type="number" min={0} max={maxUnidadeSelecionada} value={qtd}
                  onChange={(e) => setQtd(Math.min(maxUnidadeSelecionada, Math.max(0, parseInt(e.target.value) || 0)))}
                  style={{ width: '60px', textAlign: 'center', fontWeight: 'bold', border: '1px solid #a67538', background: '#ffe4b5' }}
                />
                <button
                  onClick={handleRecrutar}
                  disabled={qtd <= 0 || qtd > maxUnidadeSelecionada}
                  style={{
                    background: '#0a1d3a', border: '2px solid #2e7d32', color: '#4caf50',
                    width: '30px', height: '30px', cursor: (qtd > 0 && qtd <= maxUnidadeSelecionada) ? 'pointer' : 'not-allowed',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '16px'
                  }}
                >✓</button>
              </div>
            </div>
          </div>
        </div>

        {/* Direita: tabela de custos */}
        <div style={{ flex: 1.2 }}>
          <div style={{ fontWeight: 'bold', fontSize: '16px', marginBottom: '5px' }}>Custos</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #a67538', background: '#ffe4b5' }}>
            <tbody>
              <tr>
                <td style={{ border: '1px solid #a67538', padding: '6px' }}>
                  <Image src="/icon_wood.png" alt="Wood" width={16} height={16} style={{ verticalAlign: 'middle', marginRight: '5px' }} />
                  <strong style={{ color: (qtd * selecionada.custos.madeira > recursos.madeira) ? 'red' : 'inherit' }}>{qtd * selecionada.custos.madeira}</strong>
                  <span style={{ fontSize: '11px', color: '#555' }}> ({selecionada.custos.madeira})</span>
                </td>
                <td style={{ border: '1px solid #a67538', padding: '6px' }}>
                  <span style={{ fontSize: '11px', color: '#555' }}>✦</span> <strong>0</strong> (0)
                </td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #a67538', padding: '6px', background: '#ffdeb3' }}>
                  <Image src="/icon_stone.png" alt="Stone" width={16} height={16} style={{ verticalAlign: 'middle', marginRight: '5px' }} />
                  <strong style={{ color: (qtd * selecionada.custos.pedra > recursos.pedra) ? 'red' : 'inherit' }}>{qtd * selecionada.custos.pedra}</strong>
                  <span style={{ fontSize: '11px', color: '#555' }}> ({selecionada.custos.pedra})</span>
                </td>
                <td style={{ border: '1px solid #a67538', padding: '6px', background: '#ffdeb3' }}>
                  <Image src="/icon_pop.png" alt="Pop" width={16} height={16} style={{ verticalAlign: 'middle', marginRight: '5px' }} />
                  <strong style={{ color: (qtd * selecionada.custos.populacao > recursos.populacao) ? 'red' : 'inherit' }}>{qtd * selecionada.custos.populacao}</strong>
                  <span style={{ fontSize: '11px', color: '#555' }}> ({selecionada.custos.populacao})</span>
                </td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #a67538', padding: '6px' }}>
                  <Image src="/icon_silver.png" alt="Silver" width={16} height={16} style={{ verticalAlign: 'middle', marginRight: '5px' }} />
                  <strong style={{ color: (qtd * selecionada.custos.prata > recursos.prata) ? 'red' : 'inherit' }}>{qtd * selecionada.custos.prata}</strong>
                  <span style={{ fontSize: '11px', color: '#555' }}> ({selecionada.custos.prata})</span>
                </td>
                <td style={{ border: '1px solid #a67538', padding: '6px' }}>
                  <span>⏱</span> <strong>{formatarTempoRelogio(calcularTempoRecrutamento(unidadeSelecionada, qtd || 1) * (qtd || 0))}</strong>
                  <span style={{ fontSize: '11px', color: '#555' }}> ({formatarTempoRelogio(calcularTempoRecrutamento(unidadeSelecionada, 1))})</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Fila de recrutamento */}
      <div style={{ marginTop: '20px', borderTop: '2px solid #a67c52', paddingTop: '15px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px' }}>
          <span>Em treino ({fila.length}/7)</span>
        </div>

        <div style={{
          background: 'linear-gradient(to bottom, #dcb87d, #c89c62)',
          border: '2px solid #8b5a2b', padding: '10px',
          display: 'flex', gap: '10px', minHeight: '60px'
        }}>
          {fila.map((item, i) => {
            const restante = Math.max(0, Math.ceil((item.fimTempo - agora) / 1000));
            const u = UNIDADES[item.unidade];
            return (
              <div key={i} style={{ width: '40px', height: '40px', position: 'relative', border: '1px solid #8b5a2b', background: '#000' }}>
                <Image src={u.retrato} alt={u.nome} fill style={{ objectFit: 'cover' }} />
                <div style={{ position: 'absolute', bottom: '-2px', right: '-2px', background: 'black', color: '#ffb74d', fontSize: '10px', padding: '1px 3px', border: '1px solid #8b5a2b' }}>
                  {item.quantidade}
                </div>
                {i === 0 && (
                  <div style={{ position: 'absolute', top: '-18px', left: 0, width: '100%', textAlign: 'center', fontSize: '11px', color: '#000', fontWeight: 'bold' }}>
                    {formatarTempoRelogio(restante)}
                  </div>
                )}
              </div>
            );
          })}

          {Array.from({ length: Math.max(0, 7 - fila.length) }).map((_, i) => (
            <div key={`empty-${i}`} style={{ width: '40px', height: '40px', border: '1px dashed #a67538', opacity: 0.5, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <Image src="/icon_pop.png" alt="Empty" width={20} height={20} style={{ opacity: 0.2 }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
