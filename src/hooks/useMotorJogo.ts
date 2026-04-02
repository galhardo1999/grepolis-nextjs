"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { PROD_DE_RECURSOS, TEMPO_CONSTRUCAO_EDIFICIOS, TEMPO_TREINAMENTO_UNIDADES, TAMANHO_MAXIMO_FILA, PRODUCAO_BASE_FAVOR } from '@/lib/config';
import { IdDeus, PODERES_DIVINOS } from '@/lib/deuses';
import { EDIFICIOS, IdEdificio } from '@/lib/edificios';
import { UNIDADES, IdUnidade } from '@/lib/unidades';
import { ESTADO_INICIAL, EstadoJogo } from '@/lib/estadoInicial';

export function useMotorJogo() {
  const [estado, setEstado] = useState<EstadoJogo>(ESTADO_INICIAL);
  const [carregado, setCarregado] = useState(false);
  const estadoRef = useRef(estado);

  // Sincroniza ref com estado para o intervalo
  useEffect(() => {
    estadoRef.current = estado;
  }, [estado]);

  // Define carregado ao montar para iniciar lógica apenas no cliente
  useEffect(() => {
    setCarregado(true);
  }, []);

  const calcularRenda = (edificios: Record<string, number>) => {
    const calcularProducao = (nivel: number, multiplicador: number) => {
      const producaoBase = multiplicador * 6;
      const fatorCrescimento = 1.15; // 15% de crescimento por nível
      
      if (nivel === 0) {
        // Nível 0 produz metade do nível 1
        return (producaoBase * Math.pow(fatorCrescimento, 1)) / 2;
      }
      return producaoBase * Math.pow(fatorCrescimento, nivel);
    };

    return {
      madeira: calcularProducao(edificios['timber-camp'] || 0, EDIFICIOS['timber-camp'].multiplicadorProducao) * PROD_DE_RECURSOS,
      pedra: calcularProducao(edificios['quarry'] || 0, EDIFICIOS['quarry'].multiplicadorProducao) * PROD_DE_RECURSOS,
      prata: calcularProducao(edificios['silver-mine'] || 0, EDIFICIOS['silver-mine'].multiplicadorProducao) * PROD_DE_RECURSOS
    };
  };

  const calcularPopulacaoMaxima = (nivelQuinta: number) => {
    return 100 + (nivelQuinta - 1) * 20; // 100 base, +20 por nível
  };

  const calcularRecursosMaximos = (nivelArmazem: number) => {
    // CapacidadeBase * (1.08)^n
    // Onde 1000 é a base e 1.08 é o crescimento de 8% por nível
    return Math.floor(1000 * Math.pow(1.08, nivelArmazem));
  };

  const processarFila = (estadoAtual: EstadoJogo, agora: number) => {
    let alterado = false;

    // Processar Edifícios
    while (estadoAtual.fila.length > 0 && agora >= estadoAtual.fila[0].fimTempo) {
      const tarefa = estadoAtual.fila.shift()!;
      estadoAtual.edificios[tarefa.edificio]++;

      if (tarefa.edificio === 'farm') {
        estadoAtual.recursos.populacaoMaxima = calcularPopulacaoMaxima(estadoAtual.edificios.farm);
        estadoAtual.recursos.populacao += 20;
      } else if (tarefa.edificio === 'warehouse') {
        estadoAtual.recursos.recursosMaximos = calcularRecursosMaximos(estadoAtual.edificios.warehouse);
      }
      alterado = true;
    }

    // Processar Recrutamento (Unidade por Unidade)
    if (estadoAtual.filaRecrutamento.length > 0) {
      let tarefa = estadoAtual.filaRecrutamento[0];
      let tempoPorUnidade = (tarefa.fimTempo - tarefa.inicioTempo) / tarefa.quantidade;

      while (agora >= tarefa.inicioTempo + tempoPorUnidade) {
        estadoAtual.unidades[tarefa.unidade] = (estadoAtual.unidades[tarefa.unidade] || 0) + 1;
        tarefa.quantidade -= 1;
        tarefa.inicioTempo += tempoPorUnidade;
        alterado = true;

        if (tarefa.quantidade <= 0) {
          estadoAtual.filaRecrutamento.shift();
          if (estadoAtual.filaRecrutamento.length > 0) {
            tarefa = estadoAtual.filaRecrutamento[0];
            tempoPorUnidade = (tarefa.fimTempo - tarefa.inicioTempo) / tarefa.quantidade;
          } else {
            break;
          }
        }
      }
    }

    return alterado;
  };

  // Loop do Jogo
  useEffect(() => {
    if (!carregado) return;

    const intervalo = setInterval(() => {
      const agora = Date.now();
      const estadoAtual = { ...estadoRef.current };
      const diferenca = (agora - estadoAtual.ultimaAtualizacao) / 1000;
      const renda = calcularRenda(estadoAtual.edificios);

      // Atualizar recursos com limite máximo
      const maxRecursos = estadoAtual.recursos.recursosMaximos;
      estadoAtual.recursos.madeira = Math.min(maxRecursos, estadoAtual.recursos.madeira + (renda.madeira / 3600) * diferenca);
      estadoAtual.recursos.pedra = Math.min(maxRecursos, estadoAtual.recursos.pedra + (renda.pedra / 3600) * diferenca);
      estadoAtual.recursos.prata = Math.min(maxRecursos, estadoAtual.recursos.prata + (renda.prata / 3600) * diferenca);

      // Atualizar Favor Divino
      const rendaFavor = PRODUCAO_BASE_FAVOR * PROD_DE_RECURSOS;
      estadoAtual.recursos.favor = Math.min(
        estadoAtual.recursos.favorMaximo,
        estadoAtual.recursos.favor + (rendaFavor / 3600) * diferenca
      );

      // Processar fila
      const filaAlterada = processarFila(estadoAtual, agora);

      estadoAtual.ultimaAtualizacao = agora;
      setEstado(estadoAtual);
    }, 1000);

    return () => clearInterval(intervalo);
  }, [carregado]);

  const melhorarEdificio = (idEdificio: IdEdificio) => {
    const edificio = EDIFICIOS[idEdificio];
    const qtdPendente = estado.fila.filter(f => f.edificio === idEdificio).length;

    // Verificar requisitos do edifício
    if ('requisitos' in edificio && edificio.requisitos) {
      const reqs = edificio.requisitos as Record<IdEdificio, number>;
      for (const [idReq, nivelReq] of Object.entries(reqs)) {
        const reqEdificio = idReq as IdEdificio;
        const nivelAtualReq = (estado.edificios[reqEdificio] || 0) + estado.fila.filter(f => f.edificio === reqEdificio).length;
        if (nivelAtualReq < nivelReq) {
           return { sucesso: false, motivo: `Requisitos não atendidos. Precisa de ${EDIFICIOS[reqEdificio].nome} nível ${nivelReq}.` };
        }
      }
    }

    // Verificar limite da fila
    if (estado.fila.length >= TAMANHO_MAXIMO_FILA) {
      return { sucesso: false, motivo: 'Fila de obras cheia (Máximo 10)' };
    }

    const nivelAtual = (estado.edificios[idEdificio] || 0) + qtdPendente;
    if (nivelAtual >= (edificio as any).nivelMaximo) {
      return { sucesso: false, motivo: 'Nível máximo atingido' };
    }
    const proximoNivel = nivelAtual + 1;

    const custos = calcularCustos(idEdificio, proximoNivel);
    const custoPop = (edificio as any).custoPop || 0;

    if (possuiRecursos(custos) && estado.recursos.populacao >= custoPop) {
      const novoEstado = { ...estado };
      novoEstado.recursos.madeira -= custos.madeira;
      novoEstado.recursos.pedra -= custos.pedra;
      novoEstado.recursos.prata -= custos.prata;
      novoEstado.recursos.populacao -= custoPop;

      const tempoBase = edificio.tempoBase;
      const tempo = tempoBase * Math.pow(edificio.multiplicadorTempo, proximoNivel);
      const bonusSenado = 1 - (estado.edificios['senate'] * 0.05);
      const tempoFinal = (tempo * bonusSenado) / TEMPO_CONSTRUCAO_EDIFICIOS;

      const agora = Date.now();
      const inicioTempo = novoEstado.fila.length > 0
        ? novoEstado.fila[novoEstado.fila.length - 1].fimTempo
        : agora;

      novoEstado.fila.push({
        edificio: idEdificio,
        inicioTempo: inicioTempo,
        fimTempo: inicioTempo + (tempoFinal * 1000),
        nivel: proximoNivel
      });

      setEstado(novoEstado);
      return { sucesso: true };
    }

    if (estado.recursos.populacao < custoPop) {
      return { sucesso: false, motivo: 'População insuficiente (Melhore a Quinta)' };
    }

    return { sucesso: false, motivo: 'Recursos insuficientes' };
  };

  const calcularCustos = (idEdificio: IdEdificio, nivel: number) => {
    const edificio = EDIFICIOS[idEdificio];
    const multiplicador = Math.pow(edificio.multiplicadorCusto, nivel - 1);
    return {
      madeira: Math.floor(edificio.custoBase.madeira * multiplicador),
      pedra: Math.floor(edificio.custoBase.pedra * multiplicador),
      prata: Math.floor(edificio.custoBase.prata * multiplicador)
    };
  };

  const possuiRecursos = (custos: { madeira: number, pedra: number, prata: number }) => {
    return estado.recursos.madeira >= custos.madeira &&
      estado.recursos.pedra >= custos.pedra &&
      estado.recursos.prata >= custos.prata;
  };

  const calcularTempoRecrutamento = (idUnidade: IdUnidade, quantidade: number) => {
    const unidade = UNIDADES[idUnidade];
    const tempoBase = unidade.tempoBase * quantidade;
    const nivelQuartel = estado.edificios['barracks'] || 0;
    // Cada nível do quartel reduz o tempo em 5%
    const reducao = Math.pow(0.95, nivelQuartel);
    return (tempoBase * reducao) / TEMPO_TREINAMENTO_UNIDADES;
  };

  const recrutar = (idUnidade: IdUnidade, quantidade: number) => {
    if (quantidade <= 0) return { sucesso: false, motivo: 'Quantidade inválida' };

    const unidade = UNIDADES[idUnidade];
    const custosTotal = {
      madeira: unidade.custos.madeira * quantidade,
      pedra: unidade.custos.pedra * quantidade,
      prata: unidade.custos.prata * quantidade,
      populacao: unidade.custos.populacao * quantidade
    };

    if (estado.filaRecrutamento.length >= 7) {
      return { sucesso: false, motivo: 'Fila de recrutamento cheia (Máximo 7)' };
    }

    if (possuiRecursos(custosTotal) && estado.recursos.populacao >= custosTotal.populacao) {
      const novoEstado = { ...estado };
      novoEstado.recursos.madeira -= custosTotal.madeira;
      novoEstado.recursos.pedra -= custosTotal.pedra;
      novoEstado.recursos.prata -= custosTotal.prata;
      novoEstado.recursos.populacao -= custosTotal.populacao;

      const tempoFinal = calcularTempoRecrutamento(idUnidade, quantidade);
      const agora = Date.now();
      const inicioTempo = novoEstado.filaRecrutamento.length > 0
        ? novoEstado.filaRecrutamento[novoEstado.filaRecrutamento.length - 1].fimTempo
        : agora;

      novoEstado.filaRecrutamento.push({
        unidade: idUnidade,
        quantidade: quantidade,
        inicioTempo: inicioTempo,
        fimTempo: inicioTempo + (tempoFinal * 1000)
      });

      setEstado(novoEstado);
      return { sucesso: true };
    }

    if (estado.recursos.populacao < custosTotal.populacao) {
      return { sucesso: false, motivo: 'População insuficiente' };
    }

    return { sucesso: false, motivo: 'Recursos insuficientes' };
  };

  const resetarJogo = () => {
    if (confirm("Tem certeza que deseja resetar TODA a sua pólis? Isso apagará seu progresso atual.")) {
      setEstado(ESTADO_INICIAL);
    }
  };

  const selecionarDeus = (idDeus: IdDeus) => {
    if (confirm(`Deseja selecionar ${idDeus.toUpperCase()} como seu deus? Seus pontos de favor serão resetados.`)) {
      setEstado(prev => ({
        ...prev,
        deusAtual: idDeus,
        recursos: {
          ...prev.recursos,
          favor: 0
        }
      }));
    }
  };

  const cancelarMelhoria = (indice: number) => {
    const novoEstado = { ...estado };
    const tarefa = novoEstado.fila[indice];
    if (!tarefa) return;

    const edificio = EDIFICIOS[tarefa.edificio];
    const custos = calcularCustos(tarefa.edificio, tarefa.nivel);
    const custoPop = (edificio as any).custoPop || 0;

    novoEstado.recursos.madeira += custos.madeira;
    novoEstado.recursos.pedra += custos.pedra;
    novoEstado.recursos.prata += custos.prata;
    novoEstado.recursos.populacao += custoPop;

    novoEstado.fila.splice(indice, 1);

    // Recalcular tempos
    const agora = Date.now();
    for (let i = 0; i < novoEstado.fila.length; i++) {
      const item = novoEstado.fila[i];
      const duracao = item.fimTempo - item.inicioTempo;
      item.inicioTempo = i === 0 ? agora : novoEstado.fila[i - 1].fimTempo;
      item.fimTempo = item.inicioTempo + duracao;
    }

    setEstado(novoEstado);
  };

  const cancelarRecrutamento = (indice: number) => {
    const novoEstado = { ...estado };
    const tarefa = novoEstado.filaRecrutamento[indice];
    if (!tarefa) return;

    const unidade = UNIDADES[tarefa.unidade];
    novoEstado.recursos.madeira += unidade.custos.madeira * tarefa.quantidade;
    novoEstado.recursos.pedra += unidade.custos.pedra * tarefa.quantidade;
    novoEstado.recursos.prata += unidade.custos.prata * tarefa.quantidade;
    novoEstado.recursos.populacao += unidade.custos.populacao * tarefa.quantidade;

    novoEstado.filaRecrutamento.splice(indice, 1);

    // Recalcular tempos
    const agora = Date.now();
    for (let i = 0; i < novoEstado.filaRecrutamento.length; i++) {
      const item = novoEstado.filaRecrutamento[i];
      const duracao = item.fimTempo - item.inicioTempo;
      item.inicioTempo = i === 0 ? agora : novoEstado.filaRecrutamento[i - 1].fimTempo;
      item.fimTempo = item.inicioTempo + duracao;
    }

    setEstado(novoEstado);
  };

  const definirNomeCidade = (nome: string) => {
    setEstado(prev => ({
      ...prev,
      nomeCidade: nome
    }));
  };

  const lancarPoder = (idPoder: string) => {
    const todosPoderes = Object.values(PODERES_DIVINOS).flat();
    const poder = todosPoderes.find(p => p.id === idPoder);

    if (!poder) return { sucesso: false, motivo: 'Poder não encontrado' };
    if (estado.recursos.favor < poder.custo) return { sucesso: false, motivo: 'Favor insuficiente' };

    const novoEstado = { ...estado };
    novoEstado.recursos.favor -= poder.custo;

    switch (idPoder) {
      case 'zeus-sign':
        novoEstado.unidades.chariot += 1;
        break;
      case 'zeus-bolt':
        novoEstado.recursos.pedra = Math.min(novoEstado.recursos.recursosMaximos, novoEstado.recursos.pedra + 500);
        break;
      case 'poseidon-gift':
        novoEstado.recursos.madeira = Math.min(novoEstado.recursos.recursosMaximos, novoEstado.recursos.madeira + 1000);
        break;
      case 'poseidon-call':
        novoEstado.recursos.prata = Math.min(novoEstado.recursos.recursosMaximos, novoEstado.recursos.prata + 500);
        break;
      case 'hera-wedding':
        novoEstado.recursos.madeira = Math.min(novoEstado.recursos.recursosMaximos, novoEstado.recursos.madeira + 200);
        novoEstado.recursos.pedra = Math.min(novoEstado.recursos.recursosMaximos, novoEstado.recursos.pedra + 200);
        novoEstado.recursos.prata = Math.min(novoEstado.recursos.recursosMaximos, novoEstado.recursos.prata + 200);
        break;
      case 'hera-growth':
        novoEstado.recursos.populacao += 10;
        break;
      case 'atena-wisdom':
        novoEstado.recursos.prata = Math.min(novoEstado.recursos.recursosMaximos, novoEstado.recursos.prata + 300);
        break;
      case 'atena-power':
        novoEstado.unidades.hoplite += 5;
        break;
      case 'hades-treasures':
        novoEstado.recursos.prata = Math.min(novoEstado.recursos.recursosMaximos, novoEstado.recursos.prata + 800);
        break;
      case 'hades-return':
        novoEstado.unidades.swordsman += 5;
        break;
    }

    setEstado(novoEstado);
    return { sucesso: true };
  };

  return {
    estado,
    carregado,
    melhorarEdificio,
    calcularCustos,
    calcularRenda,
    possuiRecursos,
    resetarJogo,
    selecionarDeus,
    recrutar,
    calcularTempoRecrutamento,
    cancelarMelhoria,
    cancelarRecrutamento,
    definirNomeCidade,
    lancarPoder
  };
};
