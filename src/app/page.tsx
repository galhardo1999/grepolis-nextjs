"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { useMotorJogo } from '@/hooks/useMotorJogo';
import { BarraSuperior } from '@/components/BarraSuperior';
import { ModalEdificioCidade } from '@/components/ModalEdificioCidade';
import { FilaConstrucao } from '@/components/FilaConstrucao';
import { FilaRecrutamento } from '@/components/FilaRecrutamento';
import { ModalEdificio } from '@/components/ModalEdificio';
import { IdDeus } from '@/lib/deuses';
import { IdEdificio } from '@/lib/edificios';
import { UNIDADES } from '@/lib/unidades';
import { PoderDivino } from '@/components/PoderesDivinos';
import { PainelExercito } from '@/components/PainelExercito';

export default function Inicio() {
  const {
    estado,
    carregado,
    melhorarEdificio,
    calcularCustos,
    calcularRenda,
    possuiRecursos,
    selecionarDeus,
    recrutar,
    calcularTempoRecrutamento,
    cancelarMelhoria,
    cancelarRecrutamento,
    definirNomeCidade,
    lancarPoder
  } = useMotorJogo();

  const [edificioSelecionado, setEdificioSelecionado] = useState<IdEdificio | null>(null);

  if (!carregado) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: '#050E1A',
        color: '#D4AF37',
        fontFamily: 'var(--font-heading)'
      }}>
        <h1>Carregando Pólis...</h1>
      </div>
    );
  }

  const renda = calcularRenda(estado.edificios);

  return (
    <div id="app" className={edificioSelecionado ? 'modal-open' : ''}>
      <BarraSuperior
        recursos={estado.recursos}
        renda={renda}
        nomeCidade={estado.nomeCidade}
        aoAlterarNomeCidade={definirNomeCidade}
      />

      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', display: 'flex' }}>
        <ModalEdificioCidade
          edificios={estado.edificios}
          aoClicarEdificio={setEdificioSelecionado}
        />

        <div style={{ position: 'absolute', right: '20px', top: '100px', display: 'flex', flexDirection: 'column', gap: '40px', alignItems: 'flex-end' }}>
          <PoderDivino
            idDeusAtual={estado.deusAtual}
            favor={estado.recursos.favor}
            favorMaximo={estado.recursos.favorMaximo}
            aoSelecionarDeus={selecionarDeus}
            aoLancarPoder={lancarPoder}
          />
          <PainelExercito unidades={estado.unidades} />
        </div>

        {/* ÁREA DAS FILAS INFERIORES */}
        <div id="bottom-queues">
          <FilaConstrucao fila={estado.fila} aoCancelar={cancelarMelhoria} />
          <FilaRecrutamento fila={estado.filaRecrutamento} aoCancelar={cancelarRecrutamento} />
        </div>
      </div>

      <ModalEdificio
        aberto={!!edificioSelecionado}
        aoFechar={() => setEdificioSelecionado(null)}
        idEdificio={edificioSelecionado}
        edificiosAtuais={estado.edificios}
        fila={estado.fila}
        aoMelhorar={melhorarEdificio}
        calcularCustos={calcularCustos}
        possuiRecursos={possuiRecursos}
        populacaoLivre={estado.recursos.populacao}
        aoRecrutar={recrutar}
        calcularTempoRecrutamento={calcularTempoRecrutamento}
        recursos={estado.recursos as any}
        unidades={estado.unidades}
        filaRecrutamento={estado.filaRecrutamento}
        renda={renda}
      />
    </div>
  );
}
