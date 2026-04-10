"use client";

import React, { memo } from 'react';
import Image from 'next/image';
import { TAMANHO_MAXIMO_FILA_OBRAS } from '@/lib/config';
import { EDIFICIOS, IdEdificio } from '@/lib/edificios';
import { FilaProducao, FilaProducaoItem } from './FilaProducao';

interface ItemFila {
  edificio: IdEdificio;
  inicioTempo: number;
  fimTempo: number;
  nivel: number;
}

interface FilaConstrucaoProps {
  fila: ItemFila[];
  agora: number;
  aoCancelar: (indice: number) => void;
}

export const FilaConstrucao = memo(function FilaConstrucao({ fila, agora, aoCancelar }: FilaConstrucaoProps) {
  const itens: FilaProducaoItem[] = fila.map((item) => {
    const edificio = EDIFICIOS[item.edificio];
    if (!edificio) {
      return {
        name: 'Edifício Desconhecido',
        content: <div>?</div>,
        inicioTempo: item.inicioTempo,
        fimTempo: item.fimTempo,
      };
    }
    return {
      name: edificio.nome,
      content: (
        <>
          <Image src={edificio.imagem} alt={edificio.nome} width={60} height={60} className="q-img" />
          <div className="q-level">▲ {item.nivel}</div>
        </>
      ),
      inicioTempo: item.inicioTempo,
      fimTempo: item.fimTempo,
    };
  });

  return (
    <FilaProducao
      label="OBRAS"
      itens={itens}
      agora={agora}
      maxTamanho={TAMANHO_MAXIMO_FILA_OBRAS}
      aoCancelar={aoCancelar}
    />
  );
});
