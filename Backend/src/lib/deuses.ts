export const DEUSES = {
  'zeus': {
    id: 'zeus' as const,
    nome: 'Zeus',
    retrato: '/deuses/deus_zeus.png',
    cor: '#FFD700',
    descricao: 'Rei dos Deuses, senhor do céu e do trovão.'
  },
  'poseidon': {
    id: 'poseidon' as const,
    nome: 'Poseidón',
    retrato: '/deuses/deus_poseidon.png',
    cor: '#0077BE',
    descricao: 'Senhor dos mares e dos terremotos.'
  },
  'hera': {
    id: 'hera' as const,
    nome: 'Hera',
    retrato: '/deuses/deus_hera.png',
    cor: '#DA70D6',
    descricao: 'Rainha dos Deuses, protetora do matrimônio.'
  },
  'atena': {
    id: 'atena' as const,
    nome: 'Atena',
    retrato: '/deuses/deus_atena.png',
    cor: '#D3D3D3',
    descricao: 'Deusa da sabedoria e da guerra de estratégia.'
  },
  'hades': {
    id: 'hades' as const,
    nome: 'Hades',
    retrato: '/deuses/deus_hades.png',
    cor: '#4B0082',
    descricao: 'Senhor do submundo e das riquezas subterrâneas.'
  }
};

export type IdDeus = keyof typeof DEUSES;

export const PODERES_DIVINOS = {
  'zeus': [
    { id: 'zeus-sign', nome: 'Sinal Divino', descricao: 'Invoca 1 Biga instantaneamente.', custo: 100, icone: '⚡', cooldownHoras: 24 },
    { id: 'zeus-bolt', nome: 'Relâmpago', descricao: 'Bônus de 500 de Pedra das montanhas.', custo: 200, icone: '🌩️', cooldownHoras: 24 }
  ],
  'poseidon': [
    { id: 'poseidon-gift', nome: 'Presente do Mar', descricao: 'As ondas trazem +1000 de Madeira.', custo: 100, icone: '🌊', cooldownHoras: 24 },
    { id: 'poseidon-call', nome: 'Chamado do Oceano', descricao: 'Oceano concede +500 de Prata.', custo: 150, icone: '🔱', cooldownHoras: 24 }
  ],
  'hera': [
    { id: 'hera-wedding', nome: 'Casamento Real', descricao: 'Recebe 200 de Madeira, Pedra e Prata.', custo: 30, icone: '💍', cooldownHoras: 24 },
    { id: 'hera-growth', nome: 'Crescimento', descricao: 'Abençoa com +10 de População Livre.', custo: 150, icone: '🌱', cooldownHoras: 24 }
  ],
  'atena': [
    { id: 'atena-wisdom', nome: 'Sabedoria', descricao: 'Atena concede +300 de Prata.', custo: 60, icone: '🦉', cooldownHoras: 24 },
    { id: 'atena-power', nome: 'Poder Heroico', descricao: 'Ganha 5 Hoplitas instantaneamente.', custo: 120, icone: '⚔️', cooldownHoras: 24 }
  ],
  'hades': [
    { id: 'hades-treasures', nome: 'Tesouros', descricao: 'Abre seus cofres: +800 de Prata.', custo: 150, icone: '💎', cooldownHoras: 24 },
    { id: 'hades-return', nome: 'Retorno das Trevas', descricao: 'Ganha 5 Espadachins.', custo: 100, icone: '💀', cooldownHoras: 24 }
  ]
} as const;

export type IdPoder = typeof PODERES_DIVINOS[IdDeus][number]['id'];
