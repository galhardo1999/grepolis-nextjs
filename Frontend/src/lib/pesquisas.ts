// ============================================================
// SISTEMA DE PESQUISAS DA ACADEMIA
// Define todas as pesquisas disponíveis e seus efeitos
// ============================================================

export const PESQUISAS = {
  // Economia
  'ceramica': {
    id: 'ceramica',
    nome: 'Cerâmica',
    descricao: 'Melhora as técnicas de armazenamento. Aumenta a capacidade do Armazém em 10%.',
    icone: '/pesquisas/pesq_ceramica.png',
    custo: { prata: 200 },
    requisitoAcademia: 2,
    efeito: { tipo: 'armazem_bonus' as const, valor: 0.10 }
  },
  'arado': {
    id: 'arado',
    nome: 'Arado Avançado',
    descricao: 'Técnicas agrícolas aprimoradas. Aumenta a população máxima da Quinta em 10%.',
    icone: '/pesquisas/pesq_arado.png',
    custo: { prata: 300 },
    requisitoAcademia: 3,
    efeito: { tipo: 'populacao_bonus' as const, valor: 0.10 }
  },
  // Militar
  'forja': {
    id: 'forja',
    nome: 'Forja Aprimorada',
    descricao: 'Melhora as ferramentas de construção. Reduz o tempo de construção em 15%.',
    icone: '/pesquisas/pesq_forja.png',
    custo: { prata: 500 },
    requisitoAcademia: 5,
    efeito: { tipo: 'construcao_bonus' as const, valor: 0.15 }
  },
  'metalurgia': {
    id: 'metalurgia',
    nome: 'Metalurgia',
    descricao: 'Armamentos de aço. Aumenta o ataque de todas as unidades em 10%.',
    icone: '/pesquisas/pesq_metalurgia.png',
    custo: { prata: 600 },
    requisitoAcademia: 6,
    efeito: { tipo: 'ataque_bonus' as const, valor: 0.10 }
  },
  'escudo': {
    id: 'escudo',
    nome: 'Escudos Reforçados',
    descricao: 'Proteção aprimorada. Aumenta a defesa de todas as unidades em 10%.',
    icone: '/pesquisas/pesq_escudo.png',
    custo: { prata: 600 },
    requisitoAcademia: 8,
    efeito: { tipo: 'defesa_bonus' as const, valor: 0.10 }
  },
  'estrategia': {
    id: 'estrategia',
    nome: 'Estratégia de Guerra',
    descricao: 'Arte da guerra grega. Reduz o tempo de recrutamento em 20%.',
    icone: '/pesquisas/pesq_estrategia.png',
    custo: { prata: 800 },
    requisitoAcademia: 10,
    efeito: { tipo: 'recrutamento_bonus' as const, valor: 0.20 }
  },
  // Avançadas
  'navegacao': {
    id: 'navegacao',
    nome: 'Navegação Avançada',
    descricao: 'Domínio dos mares. Habilita o treinamento de unidades navais no Porto.',
    icone: '/pesquisas/pesq_navegacao.png',
    custo: { prata: 1000 },
    requisitoAcademia: 12,
    efeito: { tipo: 'desbloquear_naval' as const, valor: 1 }
  },
  'espionagem': {
    id: 'espionagem',
    nome: 'Arte da Espionagem',
    descricao: 'Treine espiões na Gruta. Permite missões de espionagem contra inimigos.',
    icone: '/pesquisas/pesq_espionagem.png',
    custo: { prata: 1200 },
    requisitoAcademia: 15,
    efeito: { tipo: 'desbloquear_espioes' as const, valor: 1 }
  }
} as const;

export type IdPesquisa = keyof typeof PESQUISAS;
