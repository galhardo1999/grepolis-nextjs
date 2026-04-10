"use client";

import React, { memo } from 'react';
import Image from 'next/image';
import { TAMANHO_MAXIMO_FILA_RECRUTAMENTO } from '@/lib/config';
import { UNIDADES, IdUnidade } from '@/lib/unidades';
import { FilaProducao, FilaProducaoItem } from './FilaProducao';

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
  const itens: FilaProducaoItem[] = fila.map((item) => {
    const unidade = UNIDADES[item.unidade];
    if (!unidade) {
      return {
        name: 'Unidade Desconhecida',
        content: <div className="q-img" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>?</div>,
        inicioTempo: item.inicioTempo,
        fimTempo: item.fimTempo,
      };
    }
    return {
      name: unidade.nome,
      content: (
        <>
          <Image src={unidade.retrato} alt={unidade.nome} width={60} height={60} className="q-img" />
          <div className="q-level" style={{ color: '#ffcc80' }}>{item.quantidade}</div>
        </>
      ),
      inicioTempo: item.inicioTempo,
      fimTempo: item.fimTempo,
    };
  });

  return (
    <FilaProducao
      label="QUARTEL"
      labelColor="#4e342e"
      itens={itens}
      agora={agora}
      maxTamanho={TAMANHO_MAXIMO_FILA_RECRUTAMENTO}
      aoCancelar={aoCancelar}
    />
  );
});
