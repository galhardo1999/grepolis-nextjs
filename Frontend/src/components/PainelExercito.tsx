"use client";

import React, { memo } from 'react';
import Image from 'next/image';
import { UNIDADES, IdUnidade } from '@/lib/unidades';

// PERF-01 FIX: React.memo — só re-renderiza quando unidades mudam

interface PainelExercitoProps {
  unidades: Record<string, number>;
}

export const PainelExercito = memo(function PainelExercito({ unidades }: PainelExercitoProps) {
  const todosIdsUnidades = Object.keys(UNIDADES) as IdUnidade[];
  const terrestres = todosIdsUnidades.filter(id => UNIDADES[id].tipo === 'terrestre');
  const navais = todosIdsUnidades.filter(id => UNIDADES[id].tipo === 'naval');

  const renderGrid = (ids: IdUnidade[]) => {
    const idsTreinados = ids.filter(id => (unidades[id] || 0) > 0);

    if (idsTreinados.length === 0) {
      return (
        <div style={{ color: '#888', fontSize: '0.85rem', fontStyle: 'italic', padding: '10px 0' }}>
          Nenhuma unidade.
        </div>
      );
    }

    return (
      <div className="army-grid">
        {idsTreinados.map(id => {
          const quantidade = unidades[id];
          const u = UNIDADES[id];
          return (
            <div
              key={id}
              className="army-unit-box"
              title={`${u.nome}\n⚔️ ATQ: ${u.ataque} | 🛡️ DEF: ${u.defesa}\n🚀 VEL: ${u.velocidade}\nQuantidade: ${quantidade}`}
            >
              <Image
                src={u.retrato}
                alt={u.nome}
                width={60}
                height={60}
              />
              <div className="unit-count">{quantidade}</div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div id="army-panel">
      <h3>Tropas da Cidade</h3>
      {renderGrid(terrestres)}
      <h3 style={{ marginTop: '16px' }}>Embarcações da Cidade</h3>
      {renderGrid(navais)}
    </div>
  );
});
