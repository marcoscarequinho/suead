// Camada de IA da plataforma.
//
// Aqui ficam os tres servicos descritos na arquitetura:
//   1. gerarAvatar()      -> video sintetico do professor (HeyGen / Synthesia / D-ID)
//   2. responderDuvida()  -> assistente de duvidas por LLM dentro da aula
//   3. nivelar()          -> trilha adaptativa a partir do teste de nivelamento
//
// Sem chaves de API configuradas os tres funcionam em MODO SIMULADO, para que a
// interface possa ser desenvolvida e demonstrada de ponta a ponta. Basta
// preencher o .env para trocar a simulacao pela chamada real.

import Anthropic from '@anthropic-ai/sdk';

import { buscarMateria } from '../repositories/conteudo.js';

const AVATAR_API_KEY = process.env.AVATAR_API_KEY ?? '';
const LLM_API_KEY = process.env.LLM_API_KEY ?? '';
const LLM_MODEL = process.env.LLM_MODEL || 'claude-opus-5';
// Quantas mensagens anteriores da aula seguem para o modelo a cada pergunta.
const HISTORICO_MAXIMO = 12;

// O cliente so e criado quando ha chave — sem ela o servico segue simulado.
let anthropic = null;
function cliente() {
  if (!anthropic) anthropic = new Anthropic({ apiKey: LLM_API_KEY });
  return anthropic;
}

export const modo = {
  avatar: AVATAR_API_KEY ? 'produção' : 'simulado',
  chat: LLM_API_KEY ? 'produção' : 'simulado'
};

/**
 * Solicita a renderizacao de um professor avatar falando o roteiro da aula.
 * Em producao, trocar o bloco simulado por uma chamada ao provedor escolhido.
 */
export async function gerarAvatar({ materia, nivel, roteiro }) {
  if (!AVATAR_API_KEY) {
    return {
      modo: 'simulado',
      status: 'pronto',
      materia,
      nivel,
      duracaoEstimadaSegundos: Math.max(30, Math.round((roteiro?.length ?? 400) / 14)),
      videoUrl: null,
      aviso: 'Defina AVATAR_API_KEY no .env para renderizar o vídeo real do avatar.'
    };
  }

  // Exemplo de integracao (D-ID / HeyGen / Synthesia usam contratos parecidos):
  //
  // const resposta = await fetch('https://api.provedor.com/v1/talks', {
  //   method: 'POST',
  //   headers: {
  //     Authorization: `Bearer ${AVATAR_API_KEY}`,
  //     'Content-Type': 'application/json'
  //   },
  //   body: JSON.stringify({ avatar_id: avatarDaMateria(materia), script: roteiro })
  // });
  // const dados = await resposta.json();
  // return { modo: 'produção', status: dados.status, videoUrl: dados.result_url };

  throw new Error('Integração de avatar ainda não implementada para este provedor.');
}

/**
 * Assistente de duvidas da barra lateral da aula.
 * Recebe a pergunta do aluno mais o contexto (materia, nivel, topico da aula).
 */
export async function responderDuvida({ pergunta, materiaSlug, nivelId, topico, historico = [] }) {
  const materia = await buscarMateria(materiaSlug);
  const nivel = materia?.niveis.find((n) => n.id === nivelId) ?? materia?.niveis[0];

  if (!LLM_API_KEY) {
    return {
      modo: 'simulado',
      avatar: materia?.avatar ?? 'Professor de IA',
      resposta: respostaSimulada({ pergunta, materia, nivel, topico }),
      sugestoes: sugestoes(nivel)
    };
  }

  // O historico entra na conversa para o aluno poder dizer "explique de novo"
  // ou "e no caso anterior?" sem repetir o contexto todo.
  const mensagens = [
    ...historico.slice(-HISTORICO_MAXIMO).map((m) => ({
      role: m.papel === 'aluno' ? 'user' : 'assistant',
      content: String(m.texto ?? '').slice(0, 4000)
    })),
    { role: 'user', content: pergunta }
  ];

  const resposta = await cliente().messages.create({
    model: LLM_MODEL,
    max_tokens: 2000,
    thinking: { type: 'adaptive' },
    output_config: { effort: 'medium' },
    system: promptDoProfessor({ materia, nivel, topico }),
    messages: mensagens
  });

  if (resposta.stop_reason === 'refusal') {
    const erro = new Error('O professor de IA não pôde responder a essa pergunta.');
    erro.codigo = 'RECUSA';
    throw erro;
  }

  const texto = resposta.content
    .filter((bloco) => bloco.type === 'text')
    .map((bloco) => bloco.text)
    .join('\n')
    .trim();

  return {
    modo: 'produção',
    avatar: materia?.avatar ?? 'Professor de IA',
    resposta: texto || 'Não consegui formular a explicação agora. Pode repetir a pergunta?',
    sugestoes: sugestoes(nivel)
  };
}

/** System prompt: quem e o professor, o que ele esta ensinando e como deve responder. */
function promptDoProfessor({ materia, nivel, topico }) {
  const roteiro = (nivel?.topicos ?? []).map((t, i) => `${i + 1}. ${t}`).join('\n');

  return [
    `Você é ${materia?.avatar ?? 'um professor de IA'}, professor avatar de ${materia?.nome ?? 'sua matéria'} na plataforma EducaAI.`,
    `Nível do aluno: ${nivel?.nome ?? 'não informado'}. ${nivel?.descricao ?? ''}`.trim(),
    roteiro ? `Roteiro deste nível:
${roteiro}` : '',
    topico ? `Tópico da aula agora: ${topico}.` : '',
    '\nComo responder:',
    '- Escreva em português do Brasil, na segunda pessoa ("você"), com tom acolhedor de professor particular.',
    `- Calibre a profundidade pelo nível ${nivel?.nome ?? 'do aluno'}: nunca use pré-requisito que ele ainda não viu sem explicá-lo antes.`,
    '- Explique o raciocínio em passos curtos e numerados quando o assunto exigir cálculo ou procedimento.',
    '- Use um exemplo concreto sempre que ajudar. Prefira exemplos do cotidiano brasileiro.',
    '- No máximo 4 parágrafos curtos. O texto é lido em voz alta pelo avatar, então evite tabelas, LaTeX e blocos de código longos.',
    '- Termine convidando o aluno a continuar (um exercício, outro exemplo ou a próxima dúvida).',
    `- Se a pergunta fugir de ${materia?.nome ?? 'sua matéria'}, responda em uma frase e traga o aluno de volta ao tópico da aula.`,
    '- Nunca invente fórmula, data ou fato. Se não tiver certeza, diga o que é certo e o que precisa ser conferido.'
  ]
    .filter(Boolean)
    .join('\n');
}

/* ---------------- Aula do topico ---------------- */

// Formato do roteiro. Com json_schema o modelo devolve JSON valido sempre —
// nao precisamos adivinhar secoes a partir de texto corrido.
const ESQUEMA_DA_AULA = {
  type: 'object',
  additionalProperties: false,
  required: ['abertura', 'secoes', 'exercicios', 'fechamento'],
  properties: {
    abertura: {
      type: 'string',
      description: 'Fala de abertura do avatar, 2 a 3 frases, situando o aluno no tópico.'
    },
    secoes: {
      type: 'array',
      // A API de structured outputs só aceita minItems/maxItems 0 ou 1 — a
      // contagem de 3 a 5 seções é garantida pela instrução no prompt.
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['titulo', 'explicacao', 'exemplo'],
        properties: {
          titulo: { type: 'string' },
          explicacao: {
            type: 'string',
            description: 'Explicação em 1 a 3 parágrafos curtos, lida em voz alta pelo avatar.'
          },
          exemplo: {
            type: 'string',
            description: 'Um exemplo concreto e resolvido passo a passo.'
          }
        }
      }
    },
    exercicios: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['enunciado', 'gabarito'],
        properties: {
          enunciado: { type: 'string' },
          gabarito: { type: 'string', description: 'Resposta comentada, não apenas o resultado.' }
        }
      }
    },
    fechamento: {
      type: 'string',
      description: 'Fechamento do avatar, ligando o tópico ao próximo passo da trilha.'
    }
  }
};

/**
 * Escreve a aula de um topico a partir da ementa. E uma operacao cara: quem
 * chama deve gravar o resultado (ver aulaDoTopico) em vez de gerar de novo.
 */
export async function gerarAula({ materiaSlug, nivelId, topico }) {
  if (!LLM_API_KEY) {
    const erro = new Error('Defina LLM_API_KEY no .env para gerar as aulas.');
    erro.codigo = 'SEM_CHAVE';
    throw erro;
  }

  const materia = await buscarMateria(materiaSlug);
  if (!materia) return null;
  const nivel = materia.niveis.find((n) => n.id === nivelId) ?? materia.niveis[0];
  const titulo = topico || nivel.topicos[0];

  const resposta = await cliente().messages.create({
    model: LLM_MODEL,
    max_tokens: 8000,
    thinking: { type: 'adaptive' },
    output_config: {
      effort: 'high',
      format: { type: 'json_schema', schema: ESQUEMA_DA_AULA }
    },
    system: promptDoProfessor({ materia, nivel, topico: titulo }),
    messages: [
      {
        role: 'user',
        content: [
          `Escreva a aula completa do tópico "${titulo}".`,
          `Ela faz parte do nível ${nivel.nome} de ${materia.nome} e será apresentada por você, ${materia.avatar}.`,
          'A aula precisa se sustentar sozinha: quem assistir só a ela deve sair sabendo o tópico.',
          'Não repita o conteúdo dos outros tópicos do roteiro — apenas conecte-os quando for pré-requisito.',
          'Use de 3 a 5 seções e de 3 a 5 exercícios — nem menos, nem mais.'
        ].join(' ')
      }
    ]
  });

  if (resposta.stop_reason === 'refusal') {
    const erro = new Error('O professor de IA não pôde escrever esta aula.');
    erro.codigo = 'RECUSA';
    throw erro;
  }

  const json = resposta.content
    .filter((bloco) => bloco.type === 'text')
    .map((bloco) => bloco.text)
    .join('');

  return { roteiro: JSON.parse(json), modelo: LLM_MODEL };
}

/**
 * Trilha adaptativa: converte os acertos do teste de nivelamento na posicao
 * inicial do aluno dentro da materia.
 */
export async function nivelar({ materiaSlug, acertos = 0, total = 10 }) {
  const materia = await buscarMateria(materiaSlug);
  if (!materia) return null;

  const aproveitamento = total > 0 ? acertos / total : 0;
  const id = aproveitamento >= 0.8 ? 'avancado' : aproveitamento >= 0.5 ? 'intermediario' : 'basico';
  const nivel = materia.niveis.find((n) => n.id === id);

  return {
    materia: materia.nome,
    avatar: materia.avatar,
    aproveitamento: Math.round(aproveitamento * 100),
    nivelSugerido: nivel.nome,
    nivelId: nivel.id,
    comecarPor: nivel.topicos[0],
    justificativa:
      id === 'avancado'
        ? 'Você domina a base e o conteúdo intermediário — vamos direto ao aprofundamento.'
        : id === 'intermediario'
          ? 'A base está sólida. Começamos pelo conteúdo de consolidação.'
          : 'Vamos reconstruir a base com calma antes de avançar. É o caminho mais rápido no fim.'
  };
}

function respostaSimulada({ pergunta, materia, nivel, topico }) {
  const nome = materia?.nome ?? 'a matéria';
  const foco = topico || nivel?.topicos?.[0] || 'o conteúdo da aula';
  return [
    `Boa pergunta! Vamos por partes, no nível ${nivel?.nome ?? 'atual'} de ${nome}.`,
    `Sobre "${(pergunta ?? '').trim().slice(0, 160)}": o ponto central aqui é ${foco.toLowerCase()}.`,
    'Passo 1 — identifique o que o enunciado fornece. Passo 2 — relacione com a definição que vimos na aula. Passo 3 — aplique e confira a unidade do resultado.',
    'Quer que eu refaça a explicação com outro exemplo, ou prefere um exercício para treinar agora?'
  ].join('\n\n');
}

function sugestoes(nivel) {
  const topicos = nivel?.topicos ?? [];
  return [
    'Explique de novo, mais devagar',
    topicos[1] ? `Me dê um exercício de ${topicos[1].toLowerCase()}` : 'Me dê um exercício',
    'Onde eu costumo errar nisso?'
  ];
}
