// Planos de assinatura exibidos na landing page e servidos por /api/planos.

export const planos = [
  {
    id: 'materia',
    nome: 'Por Matéria',
    preco: 39.9,
    periodo: '/mês',
    chamada: 'Foque no que você precisa agora',
    destaque: false,
    beneficios: [
      '1 matéria à sua escolha',
      'Todos os níveis (básico ao avançado)',
      'Avatar de IA com aulas ilimitadas',
      'Tira-dúvidas 24/7 no chat da aula',
      'Teste de nivelamento incluso'
    ],
    cta: 'Escolher matéria'
  },
  {
    id: 'exatas',
    nome: 'Combo Exatas',
    preco: 69.9,
    periodo: '/mês',
    chamada: 'As quatro exatas pelo preço de duas',
    destaque: false,
    selo: 'Novo',
    beneficios: [
      'Matemática, Física, Química e Estatística',
      'Todos os níveis das quatro matérias',
      'Trilha adaptativa integrada entre elas',
      'Resolução de exercícios passo a passo',
      'Tira-dúvidas 24/7 com os quatro avatares'
    ],
    cta: 'Assinar exatas'
  },
  {
    id: 'automotivo',
    nome: 'Combo Automotivo',
    preco: 69.9,
    periodo: '/mês',
    chamada: 'Mecânica, Elétrica e Ar-Condicionado',
    destaque: false,
    selo: 'Profissionalizante',
    beneficios: [
      'Mecânica, Eletricidade e Ar-Condicionado Automotivo',
      'Do básico ao diagnóstico avançado nos três',
      'Motores, esquemas elétricos e circuito de A/C em 3D',
      'Diagnóstico guiado por sintoma com a IA',
      'Certificado de conclusão por curso',
      'Tira-dúvidas 24/7 durante o serviço'
    ],
    cta: 'Assinar automotivo'
  },
  {
    id: 'mensal',
    nome: 'Completo Mensal',
    preco: 89.9,
    periodo: '/mês',
    chamada: 'Todas as matérias, sem fidelidade',
    destaque: true,
    selo: 'Mais popular',
    beneficios: [
      'Todas as matérias: exatas, humanas, idiomas e técnicos',
      'Trilha adaptativa personalizada',
      'Avatares com voz e sincronia labial',
      'Simulados e relatórios de evolução',
      'Correção de redação pela IA',
      'Cancele quando quiser'
    ],
    cta: 'Começar agora'
  },
  {
    id: 'anual',
    nome: 'Completo Anual',
    preco: 59.9,
    periodo: '/mês',
    chamada: '12x no cartão · economize 33%',
    destaque: false,
    selo: 'Melhor custo',
    beneficios: [
      'Tudo do plano Completo Mensal',
      'Mentoria de estudos mensal com IA',
      'Plano de estudos para ENEM e vestibulares',
      'Certificado de conclusão por matéria',
      'Acesso antecipado a novas matérias'
    ],
    cta: 'Assinar 12 meses'
  }
];
