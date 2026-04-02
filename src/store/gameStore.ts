// ============================================================
// ZUSTAND GAME STORE — ARCH-03
// Fonte única de verdade. Persistência automática com checksum.
// ============================================================
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { EDIFICIOS, IdEdificio } from '@/lib/edificios';
import { UNIDADES, IdUnidade } from '@/lib/unidades';
import { IdDeus, PODERES_DIVINOS } from '@/lib/deuses';
import { PESQUISAS, IdPesquisa } from '@/lib/pesquisas';
import { simularBatalha, ResultadoBatalha } from '@/lib/combate';
import { sanitizarTexto } from '@/lib/utils';
import {
  PROD_DE_RECURSOS,
  TEMPO_CONSTRUCAO_EDIFICIOS,
  TEMPO_TREINAMENTO_UNIDADES,
  TAMANHO_MAXIMO_FILA,
  PRODUCAO_BASE_FAVOR
} from '@/lib/config';

// ============================================================
// TIPOS
// ============================================================
type TipoRecurso = 'madeira' | 'pedra' | 'prata';

export interface ItemFila {
  edificio: IdEdificio;
  inicioTempo: number;
  fimTempo: number;
  nivel: number;
}

export interface ItemFilaRecrutamento {
  unidade: IdUnidade;
  quantidade: number;
  inicioTempo: number;
  fimTempo: number;
}

export interface EventoConclusao {
  tipo: 'edificio' | 'unidade';
  nome: string;
  nivel?: number;
  quantidade?: number;
}

interface Recursos {
  madeira: number;
  pedra: number;
  prata: number;
  populacao: number;
  populacaoMaxima: number;
  recursosMaximos: number;
  favor: number;
  favorMaximo: number;
  prataNaGruta: number;
}

export interface EstadoJogo {
  recursos: Recursos;
  deusAtual: IdDeus;
  edificios: Record<string, number>;
  unidades: Record<string, number>;
  pesquisasConcluidas: IdPesquisa[];
  fila: ItemFila[];
  filaRecrutamento: ItemFilaRecrutamento[];
  ultimaAtualizacao: number;
  nomeCidade: string;
}

// ============================================================
// ESTADO INICIAL
// ============================================================
const ESTADO_INICIAL: EstadoJogo = {
  recursos: {
    madeira: 250,
    pedra: 250,
    prata: 250,
    populacao: 100,
    populacaoMaxima: 100,
    recursosMaximos: 1000,
    favor: 0,
    favorMaximo: 500,
    prataNaGruta: 0
  },
  deusAtual: 'zeus',
  edificios: {
    'senate': 1,
    'timber-camp': 0,
    'quarry': 0,
    'silver-mine': 0,
    'farm': 0,
    'warehouse': 0,
    'barracks': 0,
    'temple': 0,
    'market': 0,
    'harbor': 0,
    'academy': 0,
    'walls': 0,
    'cave': 0
  },
  unidades: {
    'swordsman': 0,
    'slinger': 0,
    'archer': 0,
    'hoplite': 0,
    'horseman': 0,
    'chariot': 0,
    'catapult': 0,
    'bireme': 0,
    'transport-ship': 0,
    'trireme': 0,
  },
  pesquisasConcluidas: [],
  fila: [],
  filaRecrutamento: [],
  ultimaAtualizacao: Date.now(),
  nomeCidade: 'Granpolis'
};

// ============================================================
// HELPERS PUROS
// ============================================================
function deepClone(estado: EstadoJogo): EstadoJogo {
  return {
    ...estado,
    recursos: { ...estado.recursos },
    edificios: { ...estado.edificios },
    unidades: { ...estado.unidades },
    pesquisasConcluidas: [...estado.pesquisasConcluidas],
    fila: estado.fila.map(item => ({ ...item })),
    filaRecrutamento: estado.filaRecrutamento.map(item => ({ ...item }))
  };
}

function calcularProducaoRecurso(nivel: number, multiplicador: number): number {
  const producaoBase = multiplicador * 6;
  const fatorCrescimento = 1.15;
  if (nivel === 0) return (producaoBase * Math.pow(fatorCrescimento, 1)) / 2;
  return producaoBase * Math.pow(fatorCrescimento, nivel);
}

function calcularCapacidadeArmazem(nivelArmazem: number, temCeramica: boolean): number {
  const base = Math.floor(1000 * Math.pow(1.08, nivelArmazem));
  return temCeramica ? Math.floor(base * 1.10) : base;
}

function calcularPopulacaoMaximaPorFarm(nivelFarm: number, temArado: boolean): number {
  const base = 100 + (nivelFarm - 1) * 20;
  return temArado ? Math.floor(base * 1.10) : base;
}

function calcularProtecaoGruta(nivelGruta: number): number {
  return nivelGruta * 200;
}

const TAXAS_MERCADO: Record<TipoRecurso, Record<TipoRecurso, number>> = {
  madeira: { madeira: 1, pedra: 0.90, prata: 0.60 },
  pedra:   { madeira: 0.90, pedra: 1, prata: 0.60 },
  prata:   { madeira: 1.30, pedra: 1.30, prata: 1 }
};

// Checksum anti-tampering
const SALT = 'granpolis-2026-aegis';
function gerarChecksum(data: string): string {
  let hash = 0;
  const combined = SALT + data;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

// ============================================================
// ZUSTAND STORE
// ============================================================
interface GameActions {
  // Recursos
  calcularRenda: () => { madeira: number; pedra: number; prata: number };
  
  // Construção
  calcularCustos: (idEdificio: IdEdificio, nivel: number) => { madeira: number; pedra: number; prata: number };
  calcularTempoConstrucao: (idEdificio: IdEdificio, proximoNivel: number) => number;
  possuiRecursos: (custos: { madeira: number; pedra: number; prata: number }) => boolean;
  melhorarEdificio: (idEdificio: IdEdificio) => { sucesso: boolean; motivo?: string };
  cancelarMelhoria: (indice: number) => void;

  // Recrutamento
  calcularTempoRecrutamento: (idUnidade: IdUnidade, quantidade: number) => number;
  recrutar: (idUnidade: IdUnidade, quantidade: number) => { sucesso: boolean; motivo?: string };
  cancelarRecrutamento: (indice: number) => void;

  // Pesquisas
  temPesquisa: (id: IdPesquisa) => boolean;
  pesquisar: (id: IdPesquisa) => { sucesso: boolean; motivo?: string };

  // Combate
  atacarAldeiaBarbar: (exercitoEnviado: Record<string, number>) => ResultadoBatalha | null;

  // Poderes Divinos
  selecionarDeus: (idDeus: IdDeus) => void;
  lancarPoder: (idPoder: string) => { sucesso: boolean; motivo?: string };

  // Mercado
  trocarRecurso: (de: TipoRecurso, para: TipoRecurso, quantidade: number) => { sucesso: boolean; motivo?: string };

  // Utilidades
  definirNomeCidade: (nome: string) => void;
  resetarJogo: () => void;

  // Game Loop
  tick: (agoraMs: number) => EventoConclusao[];
}

type GameStore = EstadoJogo & GameActions;

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      // ─── ESTADO INICIAL ────────────────────────────────
      ...ESTADO_INICIAL,

      // ─── RECURSOS ──────────────────────────────────────
      calcularRenda: () => {
        const s = get();
        return {
          madeira: calcularProducaoRecurso(s.edificios['timber-camp'] || 0, EDIFICIOS['timber-camp'].multiplicadorProducao) * PROD_DE_RECURSOS,
          pedra: calcularProducaoRecurso(s.edificios['quarry'] || 0, EDIFICIOS['quarry'].multiplicadorProducao) * PROD_DE_RECURSOS,
          prata: calcularProducaoRecurso(s.edificios['silver-mine'] || 0, EDIFICIOS['silver-mine'].multiplicadorProducao) * PROD_DE_RECURSOS
        };
      },

      // ─── CONSTRUÇÃO ────────────────────────────────────
      calcularCustos: (idEdificio, nivel) => {
        const edificio = EDIFICIOS[idEdificio];
        const multiplicador = Math.pow(edificio.multiplicadorCusto, nivel - 1);
        return {
          madeira: Math.floor(edificio.custoBase.madeira * multiplicador),
          pedra: Math.floor(edificio.custoBase.pedra * multiplicador),
          prata: Math.floor(edificio.custoBase.prata * multiplicador)
        };
      },

      calcularTempoConstrucao: (idEdificio, proximoNivel) => {
        const s = get();
        const edificio = EDIFICIOS[idEdificio];
        const temForja = s.pesquisasConcluidas.includes('forja');
        const bonusForja = temForja ? 0.85 : 1;
        const bonusSenado = Math.max(0.1, 1 - (s.edificios['senate'] * 0.05));
        const tempo = edificio.tempoBase * Math.pow(edificio.multiplicadorTempo, proximoNivel);
        return (tempo * bonusSenado * bonusForja) / TEMPO_CONSTRUCAO_EDIFICIOS;
      },

      possuiRecursos: (custos) => {
        const r = get().recursos;
        return r.madeira >= custos.madeira && r.pedra >= custos.pedra && r.prata >= custos.prata;
      },

      melhorarEdificio: (idEdificio) => {
        const s = get();
        const edificio = EDIFICIOS[idEdificio];
        const qtdPendente = s.fila.filter(f => f.edificio === idEdificio).length;

        // Verificar requisitos
        if ('requisitos' in edificio && edificio.requisitos) {
          const reqs = edificio.requisitos as Record<IdEdificio, number>;
          for (const [idReq, nivelReq] of Object.entries(reqs)) {
            const reqEdificio = idReq as IdEdificio;
            const nivelAtualReq = (s.edificios[reqEdificio] || 0) + s.fila.filter(f => f.edificio === reqEdificio).length;
            if (nivelAtualReq < nivelReq) {
              return { sucesso: false, motivo: `Requer ${EDIFICIOS[reqEdificio].nome} Nv. ${nivelReq}` };
            }
          }
        }

        if (s.fila.length >= TAMANHO_MAXIMO_FILA) {
          return { sucesso: false, motivo: 'Fila de obras cheia (Máximo 10)' };
        }

        const nivelAtual = (s.edificios[idEdificio] || 0) + qtdPendente;
        if (nivelAtual >= (edificio as any).nivelMaximo) {
          return { sucesso: false, motivo: 'Nível máximo atingido' };
        }

        const proximoNivel = nivelAtual + 1;
        const custos = get().calcularCustos(idEdificio, proximoNivel);
        const custoPop = (edificio as any).custoPop || 0;

        if (s.recursos.madeira >= custos.madeira && s.recursos.pedra >= custos.pedra && s.recursos.prata >= custos.prata && s.recursos.populacao >= custoPop) {
          const clone = deepClone(s);
          clone.recursos.madeira -= custos.madeira;
          clone.recursos.pedra -= custos.pedra;
          clone.recursos.prata -= custos.prata;
          clone.recursos.populacao -= custoPop;

          const tempoFinal = get().calcularTempoConstrucao(idEdificio, proximoNivel);
          const agoraMs = Date.now();
          const inicioTempo = clone.fila.length > 0 ? clone.fila[clone.fila.length - 1].fimTempo : agoraMs;

          clone.fila.push({ edificio: idEdificio, inicioTempo, fimTempo: inicioTempo + (tempoFinal * 1000), nivel: proximoNivel });

          set({
            recursos: clone.recursos,
            fila: clone.fila
          });
          return { sucesso: true };
        }

        if (s.recursos.populacao < custoPop) return { sucesso: false, motivo: 'População insuficiente (Melhore a Quinta)' };
        return { sucesso: false, motivo: 'Recursos insuficientes' };
      },

      cancelarMelhoria: (indice) => {
        const s = get();
        const clone = deepClone(s);
        const tarefa = clone.fila[indice];
        if (!tarefa) return;

        const custos = get().calcularCustos(tarefa.edificio, tarefa.nivel);
        const custoPop = (EDIFICIOS[tarefa.edificio] as any).custoPop || 0;

        clone.recursos.madeira = Math.min(clone.recursos.recursosMaximos, clone.recursos.madeira + custos.madeira);
        clone.recursos.pedra = Math.min(clone.recursos.recursosMaximos, clone.recursos.pedra + custos.pedra);
        clone.recursos.prata = Math.min(clone.recursos.recursosMaximos, clone.recursos.prata + custos.prata);
        clone.recursos.populacao += custoPop;

        clone.fila.splice(indice, 1);

        const agoraMs = Date.now();
        for (let i = 0; i < clone.fila.length; i++) {
          const item = clone.fila[i];
          const duracao = item.fimTempo - item.inicioTempo;
          item.inicioTempo = i === 0 ? agoraMs : clone.fila[i - 1].fimTempo;
          item.fimTempo = item.inicioTempo + duracao;
        }

        set({ recursos: clone.recursos, fila: clone.fila });
      },

      // ─── RECRUTAMENTO ──────────────────────────────────
      calcularTempoRecrutamento: (idUnidade, quantidade) => {
        const s = get();
        const unidade = UNIDADES[idUnidade];
        const tempoBase = unidade.tempoBase * quantidade;

        // Navais usam nível do porto
        const isNaval = ['bireme', 'transport-ship', 'trireme'].includes(idUnidade);
        const nivelEdificio = isNaval ? (s.edificios['harbor'] || 0) : (s.edificios['barracks'] || 0);
        const reducao = Math.pow(0.95, nivelEdificio);

        const temEstrategia = s.pesquisasConcluidas.includes('estrategia');
        const reducaoEstrategia = temEstrategia ? 0.80 : 1;
        return (tempoBase * reducao * reducaoEstrategia) / TEMPO_TREINAMENTO_UNIDADES;
      },

      recrutar: (idUnidade, quantidade) => {
        if (quantidade <= 0) return { sucesso: false, motivo: 'Quantidade inválida' };

        const s = get();
        const unidade = UNIDADES[idUnidade];

        // Navais requerem pesquisa de navegação
        const isNaval = ['bireme', 'transport-ship', 'trireme'].includes(idUnidade);
        if (isNaval && !s.pesquisasConcluidas.includes('navegacao')) {
          return { sucesso: false, motivo: 'Requer pesquisa: Navegação Avançada' };
        }
        if (isNaval && (s.edificios['harbor'] || 0) === 0) {
          return { sucesso: false, motivo: 'Requer Porto construído' };
        }

        const custosTotal = {
          madeira: unidade.custos.madeira * quantidade,
          pedra: unidade.custos.pedra * quantidade,
          prata: unidade.custos.prata * quantidade,
          populacao: unidade.custos.populacao * quantidade
        };

        if (s.filaRecrutamento.length >= 7) {
          return { sucesso: false, motivo: 'Fila de recrutamento cheia (Máximo 7)' };
        }

        if (s.recursos.madeira >= custosTotal.madeira && s.recursos.pedra >= custosTotal.pedra && s.recursos.prata >= custosTotal.prata && s.recursos.populacao >= custosTotal.populacao) {
          const clone = deepClone(s);
          clone.recursos.madeira -= custosTotal.madeira;
          clone.recursos.pedra -= custosTotal.pedra;
          clone.recursos.prata -= custosTotal.prata;
          clone.recursos.populacao -= custosTotal.populacao;

          const tempoFinal = get().calcularTempoRecrutamento(idUnidade, quantidade);
          const agoraMs = Date.now();
          const inicioTempo = clone.filaRecrutamento.length > 0
            ? clone.filaRecrutamento[clone.filaRecrutamento.length - 1].fimTempo
            : agoraMs;

          clone.filaRecrutamento.push({
            unidade: idUnidade,
            quantidade,
            inicioTempo,
            fimTempo: inicioTempo + (tempoFinal * 1000)
          });

          set({ recursos: clone.recursos, filaRecrutamento: clone.filaRecrutamento });
          return { sucesso: true };
        }

        if (s.recursos.populacao < custosTotal.populacao) return { sucesso: false, motivo: 'População insuficiente' };
        return { sucesso: false, motivo: 'Recursos insuficientes' };
      },

      cancelarRecrutamento: (indice) => {
        const s = get();
        const clone = deepClone(s);
        const tarefa = clone.filaRecrutamento[indice];
        if (!tarefa) return;

        const unidade = UNIDADES[tarefa.unidade];
        clone.recursos.madeira = Math.min(clone.recursos.recursosMaximos, clone.recursos.madeira + unidade.custos.madeira * tarefa.quantidade);
        clone.recursos.pedra = Math.min(clone.recursos.recursosMaximos, clone.recursos.pedra + unidade.custos.pedra * tarefa.quantidade);
        clone.recursos.prata = Math.min(clone.recursos.recursosMaximos, clone.recursos.prata + unidade.custos.prata * tarefa.quantidade);
        clone.recursos.populacao += unidade.custos.populacao * tarefa.quantidade;

        clone.filaRecrutamento.splice(indice, 1);

        const agoraMs = Date.now();
        for (let i = 0; i < clone.filaRecrutamento.length; i++) {
          const item = clone.filaRecrutamento[i];
          const duracao = item.fimTempo - item.inicioTempo;
          item.inicioTempo = i === 0 ? agoraMs : clone.filaRecrutamento[i - 1].fimTempo;
          item.fimTempo = item.inicioTempo + duracao;
        }

        set({ recursos: clone.recursos, filaRecrutamento: clone.filaRecrutamento });
      },

      // ─── PESQUISAS ─────────────────────────────────────
      temPesquisa: (id) => get().pesquisasConcluidas.includes(id),

      pesquisar: (idPesquisa) => {
        const s = get();
        const pesquisa = PESQUISAS[idPesquisa];
        const nivelAcademia = s.edificios['academy'] || 0;

        if (s.pesquisasConcluidas.includes(idPesquisa)) return { sucesso: false, motivo: 'Pesquisa já concluída' };
        if (nivelAcademia < pesquisa.requisitoAcademia) return { sucesso: false, motivo: `Requer Academia Nv. ${pesquisa.requisitoAcademia}` };
        if (s.recursos.prata < pesquisa.custo.prata) return { sucesso: false, motivo: `Prata insuficiente (${pesquisa.custo.prata} necessário)` };

        const clone = deepClone(s);
        clone.recursos.prata -= pesquisa.custo.prata;
        clone.pesquisasConcluidas.push(idPesquisa);

        if (idPesquisa === 'ceramica') {
          clone.recursos.recursosMaximos = calcularCapacidadeArmazem(clone.edificios['warehouse'], true);
        } else if (idPesquisa === 'arado') {
          clone.recursos.populacaoMaxima = calcularPopulacaoMaximaPorFarm(clone.edificios['farm'], true);
        }

        set({ recursos: clone.recursos, pesquisasConcluidas: clone.pesquisasConcluidas });
        return { sucesso: true };
      },

      // ─── COMBATE ───────────────────────────────────────
      atacarAldeiaBarbar: (exercitoEnviado) => {
        const s = get();
        const nivelMuralhaInimiga = Math.floor(Math.random() * 5);
        const defensaBarbar: Record<string, number> = {
          'swordsman': 5 + Math.floor(Math.random() * 10),
          'slinger': 3 + Math.floor(Math.random() * 8)
        };
        const recursosBarbar = {
          madeira: 200 + Math.floor(Math.random() * 500),
          pedra: 200 + Math.floor(Math.random() * 500),
          prata: 100 + Math.floor(Math.random() * 300)
        };

        const temMetalurgia = s.pesquisasConcluidas.includes('metalurgia');
        const temEscudo = s.pesquisasConcluidas.includes('escudo');

        const resultado = simularBatalha(exercitoEnviado, defensaBarbar, nivelMuralhaInimiga, recursosBarbar, temMetalurgia ? 1.10 : 1.0, temEscudo ? 1.10 : 1.0);

        const clone = deepClone(s);
        if (resultado.sucesso) {
          clone.recursos.madeira = Math.min(clone.recursos.recursosMaximos, clone.recursos.madeira + resultado.recursosRoubados.madeira);
          clone.recursos.pedra = Math.min(clone.recursos.recursosMaximos, clone.recursos.pedra + resultado.recursosRoubados.pedra);
          clone.recursos.prata = Math.min(clone.recursos.recursosMaximos, clone.recursos.prata + resultado.recursosRoubados.prata);
        }

        for (const [id, baixas] of Object.entries(resultado.baixasAtacante)) {
          const uid = id as IdUnidade;
          clone.unidades[uid] = Math.max(0, (clone.unidades[uid] || 0) - baixas);
        }

        set({ recursos: clone.recursos, unidades: clone.unidades });
        return resultado;
      },

      // ─── PODERES DIVINOS ───────────────────────────────
      selecionarDeus: (idDeus) => set({ deusAtual: idDeus, recursos: { ...get().recursos, favor: 0 } }),

      lancarPoder: (idPoder) => {
        const s = get();
        const todosPoderes = Object.values(PODERES_DIVINOS).flat();
        const poder = todosPoderes.find(p => p.id === idPoder);

        if (!poder) return { sucesso: false, motivo: 'Poder não encontrado' };
        if (s.recursos.favor < poder.custo) return { sucesso: false, motivo: 'Favor insuficiente' };

        const clone = deepClone(s);
        clone.recursos.favor -= poder.custo;

        switch (idPoder) {
          case 'zeus-sign': clone.unidades['chariot'] = (clone.unidades['chariot'] || 0) + 1; break;
          case 'zeus-bolt': clone.recursos.pedra = Math.min(clone.recursos.recursosMaximos, clone.recursos.pedra + 500); break;
          case 'poseidon-gift': clone.recursos.madeira = Math.min(clone.recursos.recursosMaximos, clone.recursos.madeira + 1000); break;
          case 'poseidon-call': clone.recursos.prata = Math.min(clone.recursos.recursosMaximos, clone.recursos.prata + 500); break;
          case 'hera-wedding':
            clone.recursos.madeira = Math.min(clone.recursos.recursosMaximos, clone.recursos.madeira + 200);
            clone.recursos.pedra = Math.min(clone.recursos.recursosMaximos, clone.recursos.pedra + 200);
            clone.recursos.prata = Math.min(clone.recursos.recursosMaximos, clone.recursos.prata + 200);
            break;
          case 'hera-growth': clone.recursos.populacao += 10; break;
          case 'atena-wisdom': clone.recursos.prata = Math.min(clone.recursos.recursosMaximos, clone.recursos.prata + 300); break;
          case 'atena-power': clone.unidades['hoplite'] = (clone.unidades['hoplite'] || 0) + 5; break;
          case 'hades-treasures': clone.recursos.prata = Math.min(clone.recursos.recursosMaximos, clone.recursos.prata + 800); break;
          case 'hades-return': clone.unidades['swordsman'] = (clone.unidades['swordsman'] || 0) + 5; break;
        }

        set({ recursos: clone.recursos, unidades: clone.unidades });
        return { sucesso: true };
      },

      // ─── MERCADO ───────────────────────────────────────
      trocarRecurso: (de, para, quantidade) => {
        const s = get();
        if (de === para) return { sucesso: false, motivo: 'Não é possível trocar o mesmo recurso' };
        if (quantidade <= 0 || quantidade > s.recursos[de]) return { sucesso: false, motivo: 'Quantidade inválida' };

        const nivelMercado = s.edificios['market'] || 0;
        if (nivelMercado === 0) return { sucesso: false, motivo: 'Construa o Mercado primeiro' };

        const bonusMercado = 1 + (nivelMercado * 0.02);
        const taxaFinal = TAXAS_MERCADO[de][para] * bonusMercado;
        const quantidadeRecebida = Math.floor(quantidade * taxaFinal);
        if (quantidadeRecebida <= 0) return { sucesso: false, motivo: 'Quantidade muito baixa para conversão' };

        const clone = deepClone(s);
        clone.recursos[de] -= quantidade;
        clone.recursos[para] = Math.min(clone.recursos.recursosMaximos, clone.recursos[para] + quantidadeRecebida);

        set({ recursos: clone.recursos });
        return { sucesso: true };
      },

      // ─── UTILIDADES ────────────────────────────────────
      definirNomeCidade: (nome) => set({ nomeCidade: sanitizarTexto(nome, 15) }),

      resetarJogo: () => {
        localStorage.removeItem('granpolis-state');
        set({ ...ESTADO_INICIAL, ultimaAtualizacao: Date.now() });
      },

      // ─── GAME LOOP TICK ────────────────────────────────
      tick: (agoraMs) => {
        const s = get();
        const clone = deepClone(s);
        const diferenca = (agoraMs - clone.ultimaAtualizacao) / 1000;
        const eventos: EventoConclusao[] = [];

        // Produção de recursos
        const renda = {
          madeira: calcularProducaoRecurso(clone.edificios['timber-camp'] || 0, EDIFICIOS['timber-camp'].multiplicadorProducao) * PROD_DE_RECURSOS,
          pedra: calcularProducaoRecurso(clone.edificios['quarry'] || 0, EDIFICIOS['quarry'].multiplicadorProducao) * PROD_DE_RECURSOS,
          prata: calcularProducaoRecurso(clone.edificios['silver-mine'] || 0, EDIFICIOS['silver-mine'].multiplicadorProducao) * PROD_DE_RECURSOS
        };

        const max = clone.recursos.recursosMaximos;
        const m0 = clone.recursos.madeira;
        const p0 = clone.recursos.pedra;
        const s0 = clone.recursos.prata;
        const f0 = clone.recursos.favor;

        clone.recursos.madeira = Math.min(max, m0 + (renda.madeira / 3600) * diferenca);
        clone.recursos.pedra = Math.min(max, p0 + (renda.pedra / 3600) * diferenca);
        clone.recursos.prata = Math.min(max, s0 + (renda.prata / 3600) * diferenca);

        const bonusTemplo = 1 + (clone.edificios['temple'] * 0.1);
        const rendaFavor = PRODUCAO_BASE_FAVOR * PROD_DE_RECURSOS * bonusTemplo;
        clone.recursos.favor = Math.min(clone.recursos.favorMaximo, f0 + (rendaFavor / 3600) * diferenca);
        clone.recursos.prataNaGruta = calcularProtecaoGruta(clone.edificios['cave'] || 0);

        // Processar fila de edifícios
        let filaAlterada = false;
        const temCeramica = clone.pesquisasConcluidas.includes('ceramica');
        const temArado = clone.pesquisasConcluidas.includes('arado');

        while (clone.fila.length > 0 && agoraMs >= clone.fila[0].fimTempo) {
          const tarefa = clone.fila.shift()!;
          clone.edificios[tarefa.edificio]++;
          eventos.push({ tipo: 'edificio', nome: EDIFICIOS[tarefa.edificio].nome, nivel: tarefa.nivel });

          if (tarefa.edificio === 'farm') {
            clone.recursos.populacaoMaxima = calcularPopulacaoMaximaPorFarm(clone.edificios.farm, temArado);
            clone.recursos.populacao += 20;
          } else if (tarefa.edificio === 'warehouse') {
            clone.recursos.recursosMaximos = calcularCapacidadeArmazem(clone.edificios.warehouse, temCeramica);
          } else if (tarefa.edificio === 'cave') {
            clone.recursos.prataNaGruta = calcularProtecaoGruta(clone.edificios.cave);
          }
          filaAlterada = true;
        }

        // Processar fila de recrutamento
        if (clone.filaRecrutamento.length > 0) {
          let tarefa = clone.filaRecrutamento[0];
          let tempoPorUnidade = (tarefa.fimTempo - tarefa.inicioTempo) / tarefa.quantidade;
          let unidadesNoCiclo = 0;

          while (agoraMs >= tarefa.inicioTempo + tempoPorUnidade) {
            clone.unidades[tarefa.unidade] = (clone.unidades[tarefa.unidade] || 0) + 1;
            tarefa.quantidade -= 1;
            tarefa.inicioTempo += tempoPorUnidade;
            filaAlterada = true;
            unidadesNoCiclo++;

            if (tarefa.quantidade <= 0) {
              eventos.push({ tipo: 'unidade', nome: UNIDADES[tarefa.unidade].nome, quantidade: unidadesNoCiclo });
              unidadesNoCiclo = 0;
              clone.filaRecrutamento.shift();
              if (clone.filaRecrutamento.length > 0) {
                tarefa = clone.filaRecrutamento[0];
                tempoPorUnidade = (tarefa.fimTempo - tarefa.inicioTempo) / tarefa.quantidade;
              } else { break; }
            }
          }
        }

        // Só atualizar se algo mudou
        const recursosAlterados =
          Math.floor(clone.recursos.madeira) !== Math.floor(m0) ||
          Math.floor(clone.recursos.pedra) !== Math.floor(p0) ||
          Math.floor(clone.recursos.prata) !== Math.floor(s0) ||
          Math.floor(clone.recursos.favor) !== Math.floor(f0);

        if (recursosAlterados || filaAlterada) {
          clone.ultimaAtualizacao = agoraMs;
          set({
            recursos: clone.recursos,
            edificios: clone.edificios,
            unidades: clone.unidades,
            fila: clone.fila,
            filaRecrutamento: clone.filaRecrutamento,
            pesquisasConcluidas: clone.pesquisasConcluidas,
            ultimaAtualizacao: clone.ultimaAtualizacao
          });
        }

        return eventos;
      }
    }),
    {
      name: 'granpolis-state',
      storage: createJSONStorage(() => {
        // Custom storage with checksum
        return {
          getItem: (name: string) => {
            const data = localStorage.getItem(name);
            const checksum = localStorage.getItem(name + '-checksum');
            if (data) {
              if (checksum && gerarChecksum(data) !== checksum) {
                console.warn('Save adulterado detectado. Resetando.');
                localStorage.removeItem(name);
                localStorage.removeItem(name + '-checksum');
                return null;
              }
              return data;
            }
            return null;
          },
          setItem: (name: string, value: string) => {
            localStorage.setItem(name, value);
            localStorage.setItem(name + '-checksum', gerarChecksum(value));
          },
          removeItem: (name: string) => {
            localStorage.removeItem(name);
            localStorage.removeItem(name + '-checksum');
          }
        };
      }),
      // Only persist state, not actions
      partialize: (state) => ({
        recursos: state.recursos,
        deusAtual: state.deusAtual,
        edificios: state.edificios,
        unidades: state.unidades,
        pesquisasConcluidas: state.pesquisasConcluidas,
        fila: state.fila,
        filaRecrutamento: state.filaRecrutamento,
        ultimaAtualizacao: state.ultimaAtualizacao,
        nomeCidade: state.nomeCidade
      }),
      // Migrar saves antigos
      version: 5,
      migrate: (persisted: any, version: number) => {
        if (version < 5) {
          return {
            ...ESTADO_INICIAL,
            ...persisted,
            recursos: { ...ESTADO_INICIAL.recursos, ...(persisted?.recursos || {}) },
            unidades: { ...ESTADO_INICIAL.unidades, ...(persisted?.unidades || {}) }
          };
        }
        return persisted;
      }
    }
  )
);
