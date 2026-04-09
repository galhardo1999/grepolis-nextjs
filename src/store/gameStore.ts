// ============================================================
// ZUSTAND GAME STORE — ARCH-03
// Fonte única de verdade. Persistência automática com checksum.
// ============================================================
import { create } from 'zustand';
import { EDIFICIOS, IdEdificio } from '@/lib/edificios';
import { UNIDADES, IdUnidade } from '@/lib/unidades';
import { IdDeus, PODERES_DIVINOS } from '@/lib/deuses';
import { PESQUISAS, IdPesquisa } from '@/lib/pesquisas';
import { simularBatalha, ResultadoBatalha } from '@/lib/combate';
import { ALDEIAS_BARBARAS } from '@/lib/aldeias';
import { sanitizarTexto } from '@/lib/utils';
import {
  TEMPO_CONSTRUCAO_EDIFICIOS,
  TEMPO_TREINAMENTO_UNIDADES,
  TAMANHO_MAXIMO_FILA_OBRAS,
  TAMANHO_MAXIMO_FILA_RECRUTAMENTO,
  TAXAS_MERCADO,
  calcularCapacidadeArmazem,
  TipoRecurso
} from '@/lib/config';
import { calcularProducaoRecurso, calcularProducaoFavor } from '@/lib/calculoProducao';

// ============================================================
// TIPOS
// ============================================================
export type { TipoRecurso } from '@/lib/config';

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
  id: string;
  nome: string;
  nivel?: number;
  quantidade?: number;
}

export interface GanhoProducao {
  madeira: number;
  pedra: number;
  prata: number;
  favor: number;
  populacao: number;
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
  deusAtual: IdDeus | null;
  edificios: Record<string, number>;
  unidades: Record<string, number>;
  pesquisasConcluidas: IdPesquisa[];
  missoesColetadas: string[];
  fila: ItemFila[];
  filaRecrutamento: ItemFilaRecrutamento[];
  ultimaAtualizacao: number;
  nomeCidade: string;
  cooldownsAldeias: Record<string, number>;
  poderesUsadosHoje: Record<string, number>;
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
    recursosMaximos: 300,
    favor: 0,
    favorMaximo: 500,
    prataNaGruta: 0
  },
  deusAtual: null,
  edificios: {
    'senado': 1,
    'serraria': 0,
    'pedreira': 0,
    'mina-de-prata': 0,
    'fazenda': 0,
    'armazem': 0,
    'quartel': 0,
    'templo': 0,
    'mercado': 0,
    'porto': 0,
    'academia': 0,
    'muralha': 0,
    'gruta': 0
  },
  unidades: {
    'espadachim': 0,
    'fundeiro': 0,
    'arqueiro': 0,
    'hoplita': 0,
    'cavaleiro': 0,
    'carruagem': 0,
    'catapulta': 0,
    'birreme': 0,
    'navio-de-transporte': 0,
    'trirreme': 0,
  },
  pesquisasConcluidas: [],
  missoesColetadas: [],
  fila: [],
  filaRecrutamento: [],
  ultimaAtualizacao: Date.now(),
  nomeCidade: 'Granpolis',
  cooldownsAldeias: {},
  poderesUsadosHoje: {}
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
    missoesColetadas: [...estado.missoesColetadas],
    fila: estado.fila.map(item => ({ ...item })),
    filaRecrutamento: estado.filaRecrutamento.map(item => ({ ...item })),
    cooldownsAldeias: { ...estado.cooldownsAldeias },
    poderesUsadosHoje: { ...estado.poderesUsadosHoje }
  };
}

function calcularPopulacaoMaximaPorFarm(nivelFarm: number, temArado: boolean): number {
  const base = 100 + (nivelFarm - 1) * 20;
  return temArado ? Math.floor(base * 1.10) : base;
}

function calcularProtecaoGruta(nivelGruta: number): number {
  return nivelGruta * 300;
}

function rendaDoEdificio(edificios: Record<string, number>): { madeira: number; pedra: number; prata: number; populacao: number } {
  return {
    madeira: calcularProducaoRecurso(edificios['serraria'] || 0, EDIFICIOS['serraria'].multiplicadorProducao),
    pedra: calcularProducaoRecurso(edificios['pedreira'] || 0, EDIFICIOS['pedreira'].multiplicadorProducao),
    prata: calcularProducaoRecurso(edificios['mina-de-prata'] || 0, EDIFICIOS['mina-de-prata'].multiplicadorProducao),
    populacao: (edificios['fazenda'] || 0) > 0 ? 1 + Math.floor((edificios['fazenda'] || 0) / 10) : 0
  };
}

// ============================================================
// ZUSTAND STORE
// ============================================================
interface GameActions {
  // Recursos
  calcularRenda: () => { madeira: number; pedra: number; prata: number; populacao: number };

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
  atacarAldeiaBarbar: (idAldeia: string, exercitoEnviado: Record<string, number>) => ResultadoBatalha | null;
  iniciarCooldownAldeia: (idAldeia: string, duracaoMinutos: number) => void;

  // Poderes Divinos
  selecionarDeus: (idDeus: IdDeus) => { sucesso: boolean; motivo?: string };
  lancarPoder: (idPoder: string) => { sucesso: boolean; motivo?: string };

  // Mercado
  trocarRecurso: (de: TipoRecurso, para: TipoRecurso, quantidade: number) => { sucesso: boolean; motivo?: string };

  // Utilidades
  definirNomeCidade: (nome: string) => void;
  resetarJogo: () => void;
  coletarRecompensaMissao: (idMissao: string, recompensa: { madeira?: number, pedra?: number, prata?: number, favor?: number }) => { sucesso: boolean; motivo?: string };
  // Sincronização com servidor
  sincronizarEstado: (estadoServidor: {
    recursos?: Partial<Recursos>;
    edificios?: Record<string, number>;
    unidades?: Record<string, number>;
    fila?: ItemFila[];
    filaRecrutamento?: ItemFilaRecrutamento[];
    pesquisasConcluidas?: IdPesquisa[];
    missoesColetadas?: string[];
    cooldownsAldeias?: Record<string, number>;
    nomeCidade?: string;
    deusAtual?: IdDeus | null;
    poderesUsadosHoje?: Record<string, number>;
    ultimaAtualizacao?: number;
  }) => void;

  // Game Loop
  tick: (agoraMs: number, processarRecursos?: boolean) => { eventos: EventoConclusao[]; ganhos: GanhoProducao };
}

type GameStore = EstadoJogo & GameActions;

export const useGameStore = create<GameStore>()(
  (set, get) => ({
    // ─── ESTADO INICIAL ────────────────────────────────
    ...ESTADO_INICIAL,

      // ─── RECURSOS ──────────────────────────────────────
      calcularRenda: () => {
        return rendaDoEdificio(get().edificios);
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
        const bonusSenado = Math.max(0.1, 1 - (s.edificios['senado'] * 0.05));
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

        if (s.fila.length >= TAMANHO_MAXIMO_FILA_OBRAS) {
          return { sucesso: false, motivo: `Fila de obras cheia (Máximo ${TAMANHO_MAXIMO_FILA_OBRAS})` };
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

        if (s.recursos.populacao < custoPop) return { sucesso: false, motivo: 'População insuficiente (Melhore a Fazenda)' };
        return { sucesso: false, motivo: 'Recursos insuficientes' };
      },

      cancelarMelhoria: (indice) => {
        const s = get();
        const clone = deepClone(s);
        const tarefa = clone.fila[indice];
        if (!tarefa) return;

        const reembolsar = (t: ItemFila) => {
          const custos = get().calcularCustos(t.edificio, t.nivel);
          const custoPop = (EDIFICIOS[t.edificio] as any).custoPop || 0;

          clone.recursos.madeira = Math.min(clone.recursos.recursosMaximos, clone.recursos.madeira + custos.madeira);
          clone.recursos.pedra = Math.min(clone.recursos.recursosMaximos, clone.recursos.pedra + custos.pedra);
          clone.recursos.prata = Math.min(clone.recursos.recursosMaximos, clone.recursos.prata + custos.prata);
          clone.recursos.populacao += custoPop;
        };

        reembolsar(tarefa);
        clone.fila.splice(indice, 1);

        let p = indice;
        while (p < clone.fila.length) {
          const tarefaFila = clone.fila[p];
          const edificioInfo = EDIFICIOS[tarefaFila.edificio];

          let requisitosPassaram = true;
          if ('requisitos' in edificioInfo && edificioInfo.requisitos) {
            const reqs = edificioInfo.requisitos as Record<IdEdificio, number>;
            for (const [idReq, nivelReq] of Object.entries(reqs)) {
              const reqEdificio = idReq as IdEdificio;
              const nivelAtualReqAteP = (clone.edificios[reqEdificio] || 0) + clone.fila.slice(0, p).filter(f => f.edificio === reqEdificio).length;
              if (nivelAtualReqAteP < nivelReq) {
                requisitosPassaram = false;
                break;
              }
            }
          }

          if (!requisitosPassaram) {
            reembolsar(tarefaFila);
            clone.fila.splice(p, 1);
          } else {
            p++;
          }
        }

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
        const isNaval = ['birreme', 'navio-de-transporte', 'trirreme'].includes(idUnidade);
        const nivelEdificio = isNaval ? (s.edificios['porto'] || 0) : (s.edificios['quartel'] || 0);
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
        const isNaval = ['birreme', 'navio-de-transporte', 'trirreme'].includes(idUnidade);
        if (isNaval && !s.pesquisasConcluidas.includes('navegacao')) {
          return { sucesso: false, motivo: 'Requer pesquisa: Navegação Avançada' };
        }
        if (isNaval && (s.edificios['porto'] || 0) === 0) {
          return { sucesso: false, motivo: 'Requer Porto construído' };
        }

        const custosTotal = {
          madeira: unidade.custos.madeira * quantidade,
          pedra: unidade.custos.pedra * quantidade,
          prata: unidade.custos.prata * quantidade,
          populacao: unidade.custos.populacao * quantidade
        };

        if (s.filaRecrutamento.length >= TAMANHO_MAXIMO_FILA_RECRUTAMENTO) {
          return { sucesso: false, motivo: `Fila de recrutamento cheia (Máximo ${TAMANHO_MAXIMO_FILA_RECRUTAMENTO})` };
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
        const nivelAcademia = s.edificios['academia'] || 0;

        if (s.pesquisasConcluidas.includes(idPesquisa)) return { sucesso: false, motivo: 'Pesquisa já concluída' };
        if (nivelAcademia < pesquisa.requisitoAcademia) return { sucesso: false, motivo: `Requer Academia Nv. ${pesquisa.requisitoAcademia}` };
        if (s.recursos.prata < pesquisa.custo.prata) return { sucesso: false, motivo: `Prata insuficiente (${pesquisa.custo.prata} necessário)` };

        const clone = deepClone(s);
        clone.recursos.prata -= pesquisa.custo.prata;
        clone.pesquisasConcluidas.push(idPesquisa);

        if (idPesquisa === 'ceramica') {
          clone.recursos.recursosMaximos = calcularCapacidadeArmazem(clone.edificios['armazem'], true);
        } else if (idPesquisa === 'arado') {
          clone.recursos.populacaoMaxima = calcularPopulacaoMaximaPorFarm(clone.edificios['fazenda'], true);
        }

        set({ recursos: clone.recursos, pesquisasConcluidas: clone.pesquisasConcluidas });
        return { sucesso: true };
      },

      // ─── COMBATE ───────────────────────────────────────
      atacarAldeiaBarbar: (idAldeia, exercitoEnviado) => {
        const s = get();
        const aldeia = ALDEIAS_BARBARAS.find(a => a.id === idAldeia);
        if (!aldeia) return null;

        const nivelMuralhaInimiga = aldeia.nivel - 1; // Leve escala de muralha
        const defensaBarbar: Record<string, number> = aldeia.defesa as Record<string, number>;
        const recursosBarbar = aldeia.saque;

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

        if (resultado.sucesso) {
          clone.cooldownsAldeias[idAldeia] = Date.now() + (aldeia.tempoRecargaMinutos * 60 * 1000);
        }

        set({ recursos: clone.recursos, unidades: clone.unidades, cooldownsAldeias: clone.cooldownsAldeias });
        return resultado;
      },

      iniciarCooldownAldeia: (idAldeia, duracaoMinutos) => {
        const s = get();
        const clone = deepClone(s);
        clone.cooldownsAldeias[idAldeia] = Date.now() + (duracaoMinutos * 60 * 1000);
        set({ cooldownsAldeias: clone.cooldownsAldeias });
      },

      // ─── PODERES DIVINOS ───────────────────────────────
      selecionarDeus: (idDeus) => {
        const s = get();
        if ((s.edificios['templo'] || 0) < 1) return { sucesso: false, motivo: 'Construa o Templo Nv. 1 para venerar os deuses' };
        set({ deusAtual: idDeus, recursos: { ...s.recursos, favor: 0 } });
        return { sucesso: true };
      },

      lancarPoder: (idPoder) => {
        const s = get();
        if (!s.deusAtual) return { sucesso: false, motivo: 'Nenhum deus selecionado' };
        const todosPoderes = Object.values(PODERES_DIVINOS).flat();
        const poder = todosPoderes.find(p => p.id === idPoder);

        if (!poder) return { sucesso: false, motivo: 'Poder não encontrado' };
        if (s.recursos.favor < poder.custo) return { sucesso: false, motivo: 'Favor insuficiente' };

        // Check cooldown
        const cooldownHoras = (poder as any).cooldownHoras ?? 24;
        const ultimoUso = s.poderesUsadosHoje[idPoder];
        if (ultimoUso && (Date.now() - ultimoUso) < cooldownHoras * 60 * 60 * 1000) {
          return { sucesso: false, motivo: 'Poder em cooldown (use novamente amanha)' };
        }

        const clone = deepClone(s);
        clone.recursos.favor -= poder.custo;
        clone.poderesUsadosHoje[idPoder] = Date.now();

        switch (idPoder) {
          case 'zeus-sign': clone.unidades['carruagem'] = (clone.unidades['carruagem'] || 0) + 1; break;
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
          case 'atena-power': clone.unidades['hoplita'] = (clone.unidades['hoplita'] || 0) + 5; break;
          case 'hades-treasures': clone.recursos.prata = Math.min(clone.recursos.recursosMaximos, clone.recursos.prata + 800); break;
          case 'hades-return': clone.unidades['espadachim'] = (clone.unidades['espadachim'] || 0) + 5; break;
        }

        set({ recursos: clone.recursos, unidades: clone.unidades, poderesUsadosHoje: clone.poderesUsadosHoje });
        return { sucesso: true };
      },

      // ─── MERCADO ───────────────────────────────────────
      trocarRecurso: (de, para, quantidade) => {
        const s = get();
        if (de === para) return { sucesso: false, motivo: 'Não é possível trocar o mesmo recurso' };
        if (quantidade <= 0 || quantidade > s.recursos[de]) return { sucesso: false, motivo: 'Quantidade inválida' };

        const nivelMercado = s.edificios['mercado'] || 0;
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
        set({ ...ESTADO_INICIAL, ultimaAtualizacao: Date.now() });
      },

      coletarRecompensaMissao: (idMissao, recompensa) => {
        const s = get();
        if (s.missoesColetadas.includes(idMissao)) return { sucesso: false, motivo: 'Missão já coletada' };

        const clone = deepClone(s);
        clone.missoesColetadas.push(idMissao);

        if (recompensa.madeira) clone.recursos.madeira = Math.min(clone.recursos.recursosMaximos, clone.recursos.madeira + recompensa.madeira);
        if (recompensa.pedra) clone.recursos.pedra = Math.min(clone.recursos.recursosMaximos, clone.recursos.pedra + recompensa.pedra);
        if (recompensa.prata) clone.recursos.prata = Math.min(clone.recursos.recursosMaximos, clone.recursos.prata + recompensa.prata);
        if (recompensa.favor) clone.recursos.favor = Math.min(clone.recursos.favorMaximo, clone.recursos.favor + recompensa.favor);

        set({ recursos: clone.recursos, missoesColetadas: clone.missoesColetadas });
        return { sucesso: true };
      },

      // ─── SINCRONIZAR COM SERVIDOR ──────────────────────────
      // Chamado após cada resposta de uma API server-first.
      // Mescla o estado do servidor no Zustand sem sobrescrever
      // campos locais que o servidor não gerencia (ex: agora).
      sincronizarEstado: (estadoServidor) => {
        const s = get();
        const update: Partial<EstadoJogo> = {};

        if (estadoServidor.recursos) {
          update.recursos = { ...s.recursos, ...estadoServidor.recursos };
        }
        if (estadoServidor.edificios !== undefined) update.edificios = estadoServidor.edificios;
        if (estadoServidor.unidades !== undefined) update.unidades = estadoServidor.unidades;
        if (estadoServidor.fila !== undefined) update.fila = estadoServidor.fila;
        if (estadoServidor.filaRecrutamento !== undefined) update.filaRecrutamento = estadoServidor.filaRecrutamento;
        if (estadoServidor.pesquisasConcluidas !== undefined) update.pesquisasConcluidas = estadoServidor.pesquisasConcluidas;
        if (estadoServidor.missoesColetadas !== undefined) update.missoesColetadas = estadoServidor.missoesColetadas;
        if (estadoServidor.cooldownsAldeias !== undefined) update.cooldownsAldeias = estadoServidor.cooldownsAldeias;
        if (estadoServidor.nomeCidade !== undefined) update.nomeCidade = estadoServidor.nomeCidade;
        if (estadoServidor.deusAtual !== undefined) update.deusAtual = estadoServidor.deusAtual;
        if (estadoServidor.poderesUsadosHoje !== undefined) update.poderesUsadosHoje = estadoServidor.poderesUsadosHoje;
        if (estadoServidor.ultimaAtualizacao !== undefined) update.ultimaAtualizacao = estadoServidor.ultimaAtualizacao;

        if (Object.keys(update).length > 0) set(update);
      },

      // ─── GAME LOOP TICK ────────────────────────────────
      tick: (agoraMs, processarRecursos = true) => {
        const s = get();
        const clone = deepClone(s);
        const eventos: EventoConclusao[] = [];
        const ganhos = { madeira: 0, pedra: 0, prata: 0, favor: 0, populacao: 0 };

        let filaAlterada = false;
        let recursosAlterados = false;
        let m0 = clone.recursos.madeira;
        let p0 = clone.recursos.pedra;
        let s0 = clone.recursos.prata;
        let f0 = clone.recursos.favor;
        let pop0 = clone.recursos.populacao;

        // Processar fila de edifícios
        const temCeramica = clone.pesquisasConcluidas.includes('ceramica');
        const temArado = clone.pesquisasConcluidas.includes('arado');

        while (clone.fila.length > 0 && agoraMs >= clone.fila[0].fimTempo) {
          const tarefa = clone.fila.shift()!;
          clone.edificios[tarefa.edificio]++;
          eventos.push({ tipo: 'edificio', id: tarefa.edificio, nome: EDIFICIOS[tarefa.edificio].nome, nivel: tarefa.nivel });

          if (tarefa.edificio === 'fazenda') {
            clone.recursos.populacaoMaxima = calcularPopulacaoMaximaPorFarm(clone.edificios.fazenda, temArado);
            clone.recursos.populacao += 20;
          } else if (tarefa.edificio === 'armazem') {
            clone.recursos.recursosMaximos = calcularCapacidadeArmazem(clone.edificios.armazem, temCeramica);
          } else if (tarefa.edificio === 'gruta') {
            clone.recursos.prataNaGruta = calcularProtecaoGruta(clone.edificios.gruta);
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
              eventos.push({ tipo: 'unidade', id: tarefa.unidade, nome: UNIDADES[tarefa.unidade].nome, quantidade: unidadesNoCiclo });
              unidadesNoCiclo = 0;
              clone.filaRecrutamento.shift();
              if (clone.filaRecrutamento.length > 0) {
                tarefa = clone.filaRecrutamento[0];
                tempoPorUnidade = (tarefa.fimTempo - tarefa.inicioTempo) / tarefa.quantidade;
              } else { break; }
            }
          }
        }

        if (processarRecursos) {
          const diferenca = (agoraMs - clone.ultimaAtualizacao) / 1000;
          const renda = rendaDoEdificio(clone.edificios);

          clone.recursos.madeira = Math.min(clone.recursos.recursosMaximos, m0 + (renda.madeira / 3600) * diferenca);
          clone.recursos.pedra = Math.min(clone.recursos.recursosMaximos, p0 + (renda.pedra / 3600) * diferenca);
          clone.recursos.prata = Math.min(clone.recursos.recursosMaximos, s0 + (renda.prata / 3600) * diferenca);
          clone.recursos.populacao = Math.min(clone.recursos.populacaoMaxima, pop0 + (renda.populacao / 3600) * diferenca);

          const rendaFavor = calcularProducaoFavor(clone.deusAtual, clone.edificios['templo'] || 0);
          clone.recursos.favor = Math.min(clone.recursos.favorMaximo, f0 + (rendaFavor / 3600) * diferenca);
          clone.recursos.prataNaGruta = calcularProtecaoGruta(clone.edificios['gruta'] || 0);

          ganhos.madeira = Math.floor(clone.recursos.madeira) - Math.floor(m0);
          ganhos.pedra = Math.floor(clone.recursos.pedra) - Math.floor(p0);
          ganhos.prata = Math.floor(clone.recursos.prata) - Math.floor(s0);
          ganhos.favor = Math.floor(clone.recursos.favor) - Math.floor(f0);
          ganhos.populacao = Math.floor(clone.recursos.populacao) - Math.floor(pop0);

          recursosAlterados = ganhos.madeira > 0 || ganhos.pedra > 0 || ganhos.prata > 0 || ganhos.favor > 0 || ganhos.populacao > 0;
          clone.ultimaAtualizacao = agoraMs;
        }

        // Só atualizar se algo mudou

        if (recursosAlterados || filaAlterada) {
          set({
            recursos: clone.recursos,
            edificios: clone.edificios,
            unidades: clone.unidades,
            fila: clone.fila,
            filaRecrutamento: clone.filaRecrutamento,
            pesquisasConcluidas: clone.pesquisasConcluidas,
            ...(processarRecursos ? { ultimaAtualizacao: clone.ultimaAtualizacao } : {})
          });
        }

        return { eventos, ganhos };
      }
    })
);
