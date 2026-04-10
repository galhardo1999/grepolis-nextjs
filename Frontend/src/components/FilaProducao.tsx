"use client";

import React, { memo } from 'react';
import { formatarTempo } from '@/lib/utils';

export interface FilaProducaoItem {
  content: React.ReactNode;
  name: string;
  inicioTempo: number;
  fimTempo: number;
}

interface FilaProducaoProps {
  label: string;
  labelColor?: string;
  itens: FilaProducaoItem[];
  agora: number;
  maxTamanho: number;
  aoCancelar: (indice: number) => void;
}

export const FilaItem = memo(function FilaItem({
  item,
  indice,
  aoCancelar,
  agora,
}: {
  item: FilaProducaoItem;
  indice: number;
  aoCancelar: (i: number) => void;
  agora: number;
}) {
  const restante = Math.max(0, Math.ceil((item.fimTempo - agora) / 1000));
  const duracaoTotal = item.fimTempo - item.inicioTempo;
  const progresso = indice === 0
    ? Math.min(100, Math.max(0, ((agora - item.inicioTempo) / duracaoTotal) * 100))
    : 0;

  return (
    <div className={`q-item ${indice === 0 ? 'active' : ''}`}>
      <div className="q-box">
        {item.content}
        <button className="q-cancel" onClick={() => aoCancelar(indice)} title="Cancelar">×</button>
      </div>

      <div className="q-name">{item.name}</div>

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
});

export const FilaProducao = React.memo(function FilaProducao({
  label,
  labelColor = '#4e342e',
  itens,
  agora,
  maxTamanho,
  aoCancelar,
}: FilaProducaoProps) {
  return (
    <div className="queue-horizontal-panel">
      <div className="queue-label-vertical" style={{ background: labelColor }}>{label}</div>
      <div className="queue-items-container">
        {itens.map((item, indice) => (
          <FilaItem
            key={indice}
            item={item}
            indice={indice}
            aoCancelar={aoCancelar}
            agora={agora}
          />
        ))}

        {Array.from({ length: Math.max(0, maxTamanho - itens.length) }).map((_, i) => (
          <div key={`vazio-${i}`} className="q-item empty">
            <div className="q-box"></div>
          </div>
        ))}
      </div>
    </div>
  );
});
