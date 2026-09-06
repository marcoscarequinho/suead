// Aulas do curso.
//
// A ementa (materia -> nivel -> topicos) diz o QUE se estuda; o roteiro da aula
// e escrito pelo professor de IA a partir dela. Como escrever custa caro e
// demora, cada topico e gerado uma unica vez e fica guardado no banco.

import { buscarAula, salvarAula, buscarMateria } from '../repositories/conteudo.js';
import { gerarAula } from './ia.js';

// Geracoes em andamento, por topico. Se dois alunos abrirem a mesma aula ao
// mesmo tempo, os dois esperam a mesma chamada em vez de gerar duas vezes.
const emAndamento = new Map();

/**
 * Devolve o roteiro do topico, gerando-o na primeira vez.
 * @returns {Promise<{roteiro: object, origem: 'banco'|'gerada', modelo: string, criadoEm: Date|null}>}
 */
export async function aulaDoTopico({ materiaSlug, nivelId, topico }) {
  const materia = await buscarMateria(materiaSlug);
  if (!materia) return null;

  const nivel = materia.niveis.find((n) => n.id === nivelId) ?? materia.niveis[0];
  const titulo = topico || nivel.topicos[0];

  // O topico precisa existir na ementa: sem isso, qualquer texto na query
  // string viraria uma geracao paga.
  if (!nivel.topicos.includes(titulo)) {
    const erro = new Error('Tópico não faz parte deste nível.');
    erro.codigo = 'TOPICO_INVALIDO';
    throw erro;
  }

  const chave = `${materia.slug}|${nivel.id}|${titulo}`;

  const guardada = await buscarAula({
    materiaSlug: materia.slug,
    nivelCodigo: nivel.id,
    topico: titulo
  });
  if (guardada) {
    return {
      roteiro: guardada.roteiro,
      origem: 'banco',
      modelo: guardada.modelo,
      criadoEm: guardada.criado_em
    };
  }

  if (emAndamento.has(chave)) return emAndamento.get(chave);

  const promessa = (async () => {
    const gerada = await gerarAula({ materiaSlug: materia.slug, nivelId: nivel.id, topico: titulo });
    if (!gerada) return null;

    await salvarAula({
      materiaSlug: materia.slug,
      nivelCodigo: nivel.id,
      topico: titulo,
      roteiro: gerada.roteiro,
      modelo: gerada.modelo
    });

    return { roteiro: gerada.roteiro, origem: 'gerada', modelo: gerada.modelo, criadoEm: new Date() };
  })().finally(() => emAndamento.delete(chave));

  emAndamento.set(chave, promessa);
  return promessa;
}

/** Texto corrido da aula, para o avatar ler em voz alta. */
export function narracao(roteiro) {
  if (!roteiro) return '';
  return [
    roteiro.abertura,
    ...(roteiro.secoes ?? []).flatMap((s) => [s.titulo, s.explicacao, s.exemplo]),
    roteiro.fechamento
  ]
    .filter(Boolean)
    .join('\n\n');
}
