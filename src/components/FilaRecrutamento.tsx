"use client";

import React, { memo } from 'react';
import Image from 'next/image';
import { TAMANHO_MAXIMO_FILA_RECRUTAMENTO } from '@/lib/config';
import { UNIDADES, IdUnidade } from '@/lib/unidades';
import { formatarTempo } from '@/lib/utils';

// PERF-02 FIX: sem setInterval local — recebe agora do motor
// PERF-01 FIX: React.memo

interface ItemRecrutamento {
  unidade: IdUnidade;
  quantidade: number;
  inicioTempo: number;
  fimTempo: number;
}

interface FilaRecrutamentoProps {
  fila: ItemRecrutamento[];
  agora: number;
  aoCancelar: (indice: number) => void;
}

export const FilaRecrutamento = memo(function FilaRecrutamento({ fila, agora, aoCancelar }: FilaRecrutamentoProps) {
  return (
    <div className="queue-horizontal-panel">
      <div className="queue-label-vertical" style={{ background: '#4e342e' }}>QUARTEL</div>
      <div className="queue-items-container">
        {fila.map((item, indice) => {
          const unidade = UNIDADES[item.unidade];
          const restante = Math.max(0, Math.ceil((item.fimTempo - agora) / 1000));
          const duracaoTotal = item.fimTempo - item.inicioTempo;
          const progresso = indice === 0
            ? Math.min(100, Math.max(0, ((agora - item.inicioTempo) / duracaoTotal) * 100))
            : 0;

          return (
            <div key={indice} className={`q-item ${indice === 0 ? 'active' : ''}`}>
              <div className="q-box">
                <Image
                  src={unidade.retrato}
                  alt={item.unidade}
                  width={60}
                  height={60}
                  className="q-img"
                />
                <div className="q-level" style={{ color: '#ffcc80' }}>{item.quantidade}</div>
                <button className="q-cancel" onClick={() => aoCancelar(indice)} title="Cancelar recrutamento">×</button>
              </div>

              <div className="q-name">{unidade.nome}</div>

              {indice === 0 && (
                <div className="q-progress-container">
                  <div className="q-timer">{formatarTempo(restante)}</div>
                  <div className="q-bar-bg">
                    <div className="q-bar-fill" style={{ width: `${progresso}%` }}></div>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {Array.from({ length: Math.max(0, TAMANHO_MAXIMO_FILA_RECRUTAMENTO - fila.length) }).map((_, i) => (
          <div key={`vazio-${i}`} className="q-item empty">
            <div className="q-box"></div>
          </div>
        ))}
      </div>
    </div>
  );
});
