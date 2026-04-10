// ============================================================
// UNIDADES DE COMBATE
// Inclui terrestres + navais. Estatísticas completas.
// ============================================================

export const UNIDADES = {
  // ─── TERRESTRES ────────────────────────────────────────
  'espadachim': {
    id: 'espadachim',
    nome: 'Espadachim',
    descricao: 'Especialistas em defesa contra armas de longo alcance.',
    custos: { madeira: 95, pedra: 0, prata: 85, populacao: 1 },
    tempoBase: 20,
    retrato: '/unidades/unidade_espadachim.png',
    ataque: 30,
    defesa: 65,
    velocidade: 16,
    capacidadeTransporte: 15,
    tipo: 'terrestre' as const
  },
  'fundeiro': {
    id: 'fundeiro',
    nome: 'Fundeiro',
    descricao: 'Excelentes no ataque de longo alcance.',
    custos: { madeira: 55, pedra: 100, prata: 40, populacao: 1 },
    tempoBase: 25,
    retrato: '/unidades/unidade_fundibulario.png',
    ataque: 55,
    defesa: 15,
    velocidade: 17,
    capacidadeTransporte: 20,
    tipo: 'terrestre' as const
  },
  'arqueiro': {
    id: 'arqueiro',
    nome: 'Arqueiro',
    descricao: 'Defesa eficaz contra tropas de combate corpo a corpo.',
    custos: { madeira: 120, pedra: 0, prata: 75, populacao: 1 },
    tempoBase: 30,
    retrato: '/unidades/unidade_arqueiro.png',
    ataque: 30,
    defesa: 55,
    velocidade: 14,
    capacidadeTransporte: 10,
    tipo: 'terrestre' as const
  },
  'hoplita': {
    id: 'hoplita',
    nome: 'Hoplita',
    descricao: 'Guerreiro grego clássico, bom tanto no ataque quanto na defesa.',
    custos: { madeira: 0, pedra: 75, prata: 150, populacao: 1 },
    tempoBase: 35,
    retrato: '/unidades/unidade_hoplita.png',
    ataque: 70,
    defesa: 70,
    velocidade: 9,
    capacidadeTransporte: 20,
    tipo: 'terrestre' as const
  },
  'cavaleiro': {
    id: 'cavaleiro',
    nome: 'Cavaleiro',
    descricao: 'Unidade rápida e poderosa no ataque.',
    custos: { madeira: 240, pedra: 120, prata: 360, populacao: 3 },
    tempoBase: 60,
    retrato: '/unidades/unidade_cavaleiro.png',
    ataque: 120,
    defesa: 40,
    velocidade: 28,
    capacidadeTransporte: 60,
    tipo: 'terrestre' as const
  },
  'carruagem': {
    id: 'carruagem',
    nome: 'Carruagem',
    descricao: 'Poderosa unidade de elite, rápida e mortal.',
    custos: { madeira: 200, pedra: 440, prata: 320, populacao: 4 },
    tempoBase: 80,
    retrato: '/unidades/unidade_biga.png',
    ataque: 180,
    defesa: 60,
    velocidade: 23,
    capacidadeTransporte: 100,
    tipo: 'terrestre' as const
  },
  'catapulta': {
    id: 'catapulta',
    nome: 'Catapulta',
    descricao: 'Máquina de guerra usada para destruir as muralhas inimigas.',
    custos: { madeira: 700, pedra: 700, prata: 700, populacao: 15 },
    tempoBase: 300,
    retrato: '/unidades/unidade_catapulta.png',
    ataque: 350,
    defesa: 20,
    velocidade: 4,
    capacidadeTransporte: 0,
    tipo: 'terrestre' as const
  },

  // ─── NAVAIS (FEAT-06) ─────────────────────────────────
  'birreme': {
    id: 'birreme',
    nome: 'Birreme',
    descricao: 'Navio de guerra ágil, excelente em ataque naval. Requer: Navegação.',
    custos: { madeira: 250, pedra: 150, prata: 200, populacao: 8 },
    tempoBase: 120,
    retrato: '/unidades/unidade_bireme.png',
    ataque: 150,
    defesa: 60,
    velocidade: 20,
    capacidadeTransporte: 0,
    tipo: 'naval' as const
  },
  'navio-de-transporte': {
    id: 'navio-de-transporte',
    nome: 'Navio de Transporte',
    descricao: 'Transporta até 26 unidades de tropas terrestres para ataques marítimos.',
    custos: { madeira: 500, pedra: 250, prata: 200, populacao: 5 },
    tempoBase: 150,
    retrato: '/unidades/unidade_barco_transporte.png',
    ataque: 0,
    defesa: 30,
    velocidade: 12,
    capacidadeTransporte: 26,
    tipo: 'naval' as const
  },
  'trirreme': {
    id: 'trirreme',
    nome: 'Trirreme',
    descricao: 'O navio de guerra supremo. Defesa naval formidável e poder de ataque.',
    custos: { madeira: 700, pedra: 300, prata: 700, populacao: 16 },
    tempoBase: 300,
    retrato: '/unidades/unidade_trireme.png',
    ataque: 250,
    defesa: 180,
    velocidade: 16,
    capacidadeTransporte: 0,
    tipo: 'naval' as const
  }
} as const;

export type IdUnidade = keyof typeof UNIDADES;
