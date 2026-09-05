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

import { buscarMateria } from '../repositories/conteudo.js';

const AVATAR_API_KEY = process.env.AVATAR_API_KEY ?? '';
const LLM_API_KEY = process.env.LLM_API_KEY ?? '';

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
export async function responderDuvida({ pergunta, materiaSlug, nivelId, topico }) {
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

  // Em producao: enviar a pergunta ao LLM com o contexto da aula como system prompt.
  //
  // const resposta = await fetch('https://api.anthropic.com/v1/messages', { ... });
  //
  throw new Error('Integração de LLM ainda não implementada para este provedor.');
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
