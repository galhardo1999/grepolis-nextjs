import { EstadoJogo } from '@/store/gameStore';
import { IdPesquisa } from '@/lib/pesquisas';

export interface Recompensa {
  madeira?: number;
  pedra?: number;
  prata?: number;
  favor?: number;
  unidades?: Record<string, number>;
}

export interface Missao {
  id: string;
  titulo: string;
  descricao: string;
  verificarConclusao: (estado: EstadoJogo) => boolean;
  recompensa: Recompensa;
}

// ============================================================
// FACTORY FUNCTIONS — Elimina repetição nas verificações
// ============================================================

/** Cria verificador de nível mínimo de edifício */
const edificioMinimo = (edificio: string, nivel: number) =>
  (estado: EstadoJogo) => (estado.edificios[edificio] || 0) >= nivel;

/** Cria verificador de quantidade mínima de unidades */
const unidadesMinimas = (unidade: string, qtd: number) =>
  (estado: EstadoJogo) => (estado.unidades[unidade] || 0) >= qtd;

/** Cria verificador de pesquisa concluída */
const pesquisaConcluida = (pesquisa: IdPesquisa) =>
  (estado: EstadoJogo) => (estado.pesquisasConcluidas || []).includes(pesquisa);

/** Soma todas as unidades do jogador */
export function somarUnidades(unidades: Record<string, number>): number {
  return Object.values(unidades || {}).reduce((acc, val) => acc + (val as number), 0);
}

/** Verifica múltiplos edifícios simultaneamente (AND) */
const edificiosMinimos = (requisitos: Record<string, number>) =>
  (estado: EstadoJogo) => Object.entries(requisitos).every(([edificio, nivel]) =>
    (estado.edificios[edificio] || 0) >= nivel
  );

export const MISSOES: Missao[] = [
  // ————————————————————————
  // FASE 1 — FUNDAÇÃO
  // ————————————————————————
  {
    id: 'intro_senate',
    titulo: 'O Início de um Império',
    descricao: 'Eleve o Senado para o Nível 2 para acelerar a construção da cidade.',
    verificarConclusao: edificioMinimo('senado', 2),
    recompensa: { madeira: 150, pedra: 150 }
  },
  {
    id: 'basic_resources',
    titulo: 'Economia Básica',
    descricao: 'Construa a Serraria, a Pedreira e a Mina de Prata (todos Nível 1).',
    verificarConclusao: edificiosMinimos({ 'serraria': 1, 'pedreira': 1, 'mina-de-prata': 1 }),
    recompensa: { madeira: 100, pedra: 100, prata: 100 }
  },
  {
    id: 'warehouse_3',
    titulo: 'Muralhas de Estoque',
    descricao: 'Construa o Armazém Nível 3 para armazenar mais recursos.',
    verificarConclusao: edificioMinimo('armazem', 3),
    recompensa: { madeira: 200, pedra: 200 }
  },
  {
    id: 'agriculture',
    titulo: 'Alimentando o Povo',
    descricao: 'Melhore a Fazenda para o Nível 4 para sustentar novas tropas e obras.',
    verificarConclusao: edificioMinimo('fazenda', 4),
    recompensa: { madeira: 200, prata: 150 }
  },

  // ————————————————————————
  // FASE 2 — PREPARAÇÃO MILITAR
  // Pré-requisitos do Quartel: Senado 4, Mina de Prata 1
  // ————————————————————————
  {
    id: 'senate_4',
    titulo: 'Voz da Autoridade',
    descricao: 'Alcance o Senado Nível 4. Será necessário para construir o Quartel.',
    verificarConclusao: edificioMinimo('senado', 4),
    recompensa: { madeira: 250, pedra: 200, prata: 100 }
  },
  {
    id: 'first_barracks',
    titulo: 'Nasce um Exército',
    descricao: 'Construa o Quartel (requer Senado 4 e Mina de Prata 1).',
    verificarConclusao: edificioMinimo('quartel', 1),
    recompensa: { prata: 300, favor: 20 }
  },
  {
    id: 'recruit_swordsman',
    titulo: 'Primeiros Soldados',
    descricao: 'Recrute pelo menos 5 Espadachins no Quartel.',
    verificarConclusao: unidadesMinimas('espadachim', 5),
    recompensa: { madeira: 150, prata: 100 }
  },
  {
    id: 'recruit_slinger',
    titulo: 'Fundeiros da Pólis',
    descricao: 'Recrute 5 Fundeiros para apoio ranged.',
    verificarConclusao: unidadesMinimas('fundeiro', 5),
    recompensa: { madeira: 150, pedra: 100 }
  },
  {
    id: 'recruit_hoplite',
    titulo: 'Falange Grega',
    descricao: 'Recrute 5 Hoplitas — o orgulho da infantaria helênica.',
    verificarConclusao: unidadesMinimas('hoplita', 5),
    recompensa: { prata: 250, pedra: 200 }
  },

  // ————————————————————————
  // FASE 3 — DEFESA DA CIDADE
  // Pré-requisitos da Muralha: Senado 5, Pedreira 3
  // ————————————————————————
  {
    id: 'senate_5',
    titulo: 'Poder Crescente',
    descricao: 'Alcance o Senado Nível 5. A Muralha agora está disponível.',
    verificarConclusao: edificioMinimo('senado', 5),
    recompensa: { pedra: 300, prata: 200 }
  },
  {
    id: 'quarry_boost',
    titulo: 'Pedra para Construções',
    descricao: 'Eleve a Pedreira ao Nível 3 para poder construir a Muralha.',
    verificarConclusao: edificioMinimo('pedreira', 3),
    recompensa: { madeira: 200, pedra: 200 }
  },
  {
    id: 'defensive_walls',
    titulo: 'Muralhas de Atenas',
    descricao: 'Construa a Muralha Nível 1 para proteger sua cidade (requer Senado 5, Pedreira 3).',
    verificarConclusao: edificioMinimo('muralha', 1),
    recompensa: { pedra: 500, prata: 200 }
  },
  {
    id: 'walls_strong',
    titulo: 'Fortaleza Grega',
    descricao: 'Eleve a Muralha ao Nível 4 para uma defesa robusta.',
    verificarConclusao: edificioMinimo('muralha', 4),
    recompensa: { pedra: 800, prata: 400 }
  },

  // ————————————————————————
  // FASE 4 — COMÉRCIO
  // Pré-requisitos do Mercado: Senado 5, Armazém 5
  // ————————————————————————
  {
    id: 'warehouse_5',
    titulo: 'Armazém Expandido',
    descricao: 'Eleve o Armazém ao Nível 5 para habilitar o Mercado.',
    verificarConclusao: edificioMinimo('armazem', 5),
    recompensa: { madeira: 400, pedra: 400, prata: 200 }
  },
  {
    id: 'first_market',
    titulo: 'Comércio Próspero',
    descricao: 'Construa o Mercado (requer Senado 5 e Armazém 5).',
    verificarConclusao: edificioMinimo('mercado', 1),
    recompensa: { madeira: 300, pedra: 300, prata: 300 }
  },
  {
    id: 'market_5',
    titulo: 'Rota Comercial',
    descricao: 'Eleve o Mercado ao Nível 5 para taxas de troca melhores.',
    verificarConclusao: edificioMinimo('mercado', 5),
    recompensa: { madeira: 600, pedra: 600, prata: 600 }
  },
  {
    id: 'market_10',
    titulo: 'Império Comercial',
    descricao: 'Eleve o Mercado ao Nível 10.',
    verificarConclusao: edificioMinimo('mercado', 10),
    recompensa: { madeira: 1000, pedra: 1000, prata: 1000 }
  },

  // ————————————————————————
  // FASE 5 — PESQUISA E ELITE
  // Pré-requisitos da Academia: Senado 8, Quinta 6, Quartel 5
  // ————————————————————————
  {
    id: 'senate_8',
    titulo: 'Sabedoria do Senado',
    descricao: 'Alcance o Senado Nível 8. A Academia está se tornando acessível.',
    verificarConclusao: edificioMinimo('senado', 8),
    recompensa: { madeira: 600, pedra: 500, prata: 400 }
  },
  {
    id: 'farm_6',
    titulo: 'Celeiro Abundante',
    descricao: 'Eleve a Fazenda ao Nível 6 para sustentar um grande exército.',
    verificarConclusao: edificioMinimo('fazenda', 6),
    recompensa: { madeira: 400, prata: 300 }
  },
  {
    id: 'barracks_5',
    titulo: 'Tropa Organizada',
    descricao: 'Eleve o Quartel ao Nível 5. A Academia agora pode ser construída.',
    verificarConclusao: edificioMinimo('quartel', 5),
    recompensa: { prata: 500, madeira: 300, pedra: 300 }
  },
  {
    id: 'first_academy',
    titulo: 'Centro do Conhecimento',
    descricao: 'Construa a Academia (requer Senado 8, Fazenda 6, Quartel 5).',
    verificarConclusao: edificioMinimo('academia', 1),
    recompensa: { prata: 700, favor: 30 }
  },
  {
    id: 'first_research',
    titulo: 'Primeira Pesquisa',
    descricao: 'Pesquise sua primeira tecnologia na Academia.',
    verificarConclusao: (estado) => (estado.pesquisasConcluidas || []).length >= 1,
    recompensa: { prata: 500, madeira: 300, pedra: 300 }
  },
  {
    id: 'research_forja',
    titulo: 'Forja Afiada',
    descricao: 'Pesquise "Forja" na Academia para reduzir tempo de construção.',
    verificarConclusao: pesquisaConcluida('forja'),
    recompensa: { prata: 400, favor: 20 }
  },
  {
    id: 'recruit_chariot',
    titulo: 'Carruagem de Guerra',
    descricao: 'Recrute 3 Carruagens — unidades de elite da Academia.',
    verificarConclusao: unidadesMinimas('carruagem', 3),
    recompensa: { prata: 600, pedra: 400 }
  },

  // ————————————————————————
  // FASE 6 — EXPANSÃO MILITAR
  // ————————————————————————
  {
    id: 'army_archer',
    titulo: 'Arqueiros de Elite',
    descricao: 'Recrute 10 Arqueiros.',
    verificarConclusao: unidadesMinimas('arqueiro', 10),
    recompensa: { prata: 400, madeira: 300 }
  },
  {
    id: 'army_horseman',
    titulo: 'Cavalaria Montada',
    descricao: 'Recrute 5 Cavaleiros.',
    verificarConclusao: unidadesMinimas('cavaleiro', 5),
    recompensa: { prata: 500, madeira: 400 }
  },
  {
    id: 'army_catapult',
    titulo: 'Engenharia de Cerco',
    descricao: 'Recrute 2 Catapultas para destruir defesas inimigas.',
    verificarConclusao: unidadesMinimas('catapulta', 2),
    recompensa: { prata: 800, pedra: 500, madeira: 300 }
  },

  // ————————————————————————
  // FASE 7 — PODER DIVINO
  // ————————————————————————
  {
    id: 'senate_10',
    titulo: 'Centro do Poder',
    descricao: 'Alcance o Senado Nível 10.',
    verificarConclusao: edificioMinimo('senado', 10),
    recompensa: { madeira: 800, pedra: 700, prata: 600 }
  },
  {
    id: 'senate_15',
    titulo: 'Grande Conselho',
    descricao: 'Eleve o Senado ao Nível 15. O Templo agora é acessível.',
    verificarConclusao: edificioMinimo('senado', 15),
    recompensa: { madeira: 1500, pedra: 1200, prata: 1000 }
  },
  {
    id: 'quarry_12',
    titulo: 'Pedreira Industrial',
    descricao: 'Eleve a Pedreira ao Nível 12 — requisito para o Templo.',
    verificarConclusao: edificioMinimo('pedreira', 12),
    recompensa: { madeira: 600, pedra: 800 }
  },
  {
    id: 'walls_6',
    titulo: 'Bastião Inexpugnável',
    descricao: 'Eleve a Muralha ao Nível 6 para desbloquear o Templo.',
    verificarConclusao: edificioMinimo('muralha', 6),
    recompensa: { pedra: 1000, prata: 600 }
  },
  {
    id: 'divine_worship',
    titulo: 'Favor dos Deuses',
    descricao: 'Construa o Templo Nível 1 para liberar a seleção de Deuses.',
    verificarConclusao: edificioMinimo('templo', 1),
    recompensa: { favor: 50 }
  },
  {
    id: 'choose_god',
    titulo: 'Escolha Divina',
    descricao: 'Selecione um Deus no Templo.',
    verificarConclusao: (estado) => estado.deusAtual !== null,
    recompensa: { favor: 30, prata: 200 }
  },
  {
    id: 'use_divine_power',
    titulo: 'Intervenção Divina',
    descricao: 'Use um Poder Divino pela primeira vez.',
    verificarConclusao: (estado) => (estado.deusAtual !== null),
    recompensa: { favor: 40 }
  },

  // ————————————————————————
  // FASE 8 — AVANÇO MILITAR
  // ————————————————————————
  {
    id: 'academy_10',
    titulo: 'Centro de Pesquisa Avançada',
    descricao: 'Eleve a Academia ao Nível 10.',
    verificarConclusao: edificioMinimo('academia', 10),
    recompensa: { prata: 800, madeira: 600, pedra: 600 }
  },
  {
    id: 'research_estrategia',
    titulo: 'Estratégia Militar',
    descricao: 'Pesquise "Estratégia" na Academia para acelerar recrutamento.',
    verificarConclusao: pesquisaConcluida('estrategia'),
    recompensa: { prata: 600, favor: 30 }
  },
  {
    id: 'research_metalurgia',
    titulo: 'Metalurgia Avançada',
    descricao: 'Pesquise "Metalurgia" para bônus de ataque.',
    verificarConclusao: pesquisaConcluida('metalurgia'),
    recompensa: { prata: 700, pedra: 500 }
  },
  {
    id: 'research_escudo',
    titulo: 'Falange Protetora',
    descricao: 'Pesquise "Escudo" para bônus de defesa.',
    verificarConclusao: pesquisaConcluida('escudo'),
    recompensa: { prata: 700, pedra: 500 }
  },
  {
    id: 'research_ceramica',
    titulo: 'Cerâmica Refinada',
    descricao: 'Pesquise "Cerâmica" para expandir a capacidade do armazém em 10%.',
    verificarConclusao: pesquisaConcluida('ceramica'),
    recompensa: { madeira: 600, pedra: 400 }
  },
  {
    id: 'research_arado',
    titulo: 'Agricultura Eficiente',
    descricao: 'Pesquise "Arado" para aumentar a população em 10%.',
    verificarConclusao: pesquisaConcluida('arado'),
    recompensa: { madeira: 400, prata: 400 }
  },

  // ————————————————————————
  // FASE 9 — MARÍTIMA
  // ————————————————————————
  {
    id: 'senate_14',
    titulo: 'Autoridade Marítima',
    descricao: 'Alcance o Senado Nível 14. Preparativos para o Porto.',
    verificarConclusao: edificioMinimo('senado', 14),
    recompensa: { madeira: 1200, pedra: 1000, prata: 800 }
  },
  {
    id: 'timber_15',
    titulo: 'Florestas Reais',
    descricao: 'Eleve a Serraria ao Nível 15 — madeira para os navios.',
    verificarConclusao: edificioMinimo('serraria', 15),
    recompensa: { madeira: 1000, pedra: 500 }
  },
  {
    id: 'quarry_10',
    titulo: 'Pedreira Profunda',
    descricao: 'Eleve a Pedreira ao Nível 10.',
    verificarConclusao: edificioMinimo('pedreira', 10),
    recompensa: { pedra: 700, prata: 500 }
  },
  {
    id: 'silver_10',
    titulo: 'Minas Ricas',
    descricao: 'Eleve a Mina de Prata ao Nível 10.',
    verificarConclusao: edificioMinimo('mina-de-prata', 10),
    recompensa: { prata: 800, madeira: 400, pedra: 400 }
  },
  {
    id: 'naval_power',
    titulo: 'Acesso ao Mar',
    descricao: 'Construa o Porto (req. Senado 14, Serraria 15, Pedreira 10, Mina de Prata 10).',
    verificarConclusao: edificioMinimo('porto', 1),
    recompensa: { madeira: 1000, pedra: 500, prata: 500 }
  },
  {
    id: 'research_navegacao',
    titulo: 'Navegação Avançada',
    descricao: 'Pesquise "Navegação" na Academia para liberar navios.',
    verificarConclusao: pesquisaConcluida('navegacao'),
    recompensa: { madeira: 500, prata: 400 }
  },
  {
    id: 'first_bireme',
    titulo: 'Frota de Guerra',
    descricao: 'Construa 2 Birremes no Porto.',
    verificarConclusao: unidadesMinimas('birreme', 2),
    recompensa: { prata: 600, madeira: 400 }
  },
  {
    id: 'first_transport',
    titulo: 'Expedição Marítima',
    descricao: 'Construa 1 Navio de Transporte.',
    verificarConclusao: unidadesMinimas('navio-de-transporte', 1),
    recompensa: { madeira: 500, prata: 300 }
  },

  // ————————————————————————
  // FASE 10 — GRUTA (Espiões)
  // ————————————————————————
  {
    id: 'warehouse_4',
    titulo: 'Segredo no Armazém',
    descricao: 'Eleve o Armazém ao Nível 4 — passo para a Gruta.',
    verificarConclusao: edificioMinimo('armazem', 4),
    recompensa: { prata: 300, madeira: 200 }
  },
  {
    id: 'market_4',
    titulo: 'Negociador Experiente',
    descricao: 'Eleve o Mercado ao Nível 4. A Gruta está próxima.',
    verificarConclusao: edificioMinimo('mercado', 4),
    recompensa: { prata: 400, madeira: 200, pedra: 200 }
  },
  {
    id: 'first_cave',
    titulo: 'Esconderijo Secreto',
    descricao: 'Construa a Gruta (req. Senado 10, Armazém 4, Mercado 4).',
    verificarConclusao: edificioMinimo('gruta', 1),
    recompensa: { prata: 500, pedra: 300 }
  },

  // ————————————————————————
  // FASE 11 — CONQUISTA
  // ————————————————————————
  {
    id: 'total_army_50',
    titulo: 'Exército da Pólis',
    descricao: 'Tenha um exército total de 50 unidades.',
    verificarConclusao: (estado) => somarUnidades(estado.unidades) >= 50,
    recompensa: { prata: 1000, madeira: 600, pedra: 600 }
  },
  {
    id: 'total_army_200',
    titulo: 'Hegemonia Helênica',
    descricao: 'Tenha um exército total de 200 unidades.',
    verificarConclusao: (estado) => somarUnidades(estado.unidades) >= 200,
    recompensa: { prata: 3000, madeira: 2000, pedra: 2000, favor: 100 }
  },
  {
    id: 'senate_max',
    titulo: 'Império Eterno',
    descricao: 'Alcance o Senado Nível 25 — o ápice do poder civil.',
    verificarConclusao: edificioMinimo('senado', 25),
    recompensa: { madeira: 5000, pedra: 5000, prata: 5000, favor: 200 }
  }
];
