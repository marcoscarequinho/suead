// Comparacao entre planos.
//
// A grade de planos precisa saber qual deles o aluno ja assina, para marcar o
// cartao e trocar o CTA por "fazer upgrade", "fazer downgrade" ou "trocar".
// A regra vive aqui — e nao na view — porque a rota /assinar usa a mesma
// comparacao para recusar uma reassinatura do plano que ja esta ativo.

const ROTULOS = {
  atual: 'Seu plano atual',
  upgrade: 'Fazer upgrade',
  downgrade: 'Fazer downgrade',
  lateral: 'Trocar para este'
};

function nivelDe(plano) {
  return Number(plano?.nivel ?? 0);
}

/**
 * Relacao de um plano com o que o aluno ja tem.
 * 'nenhuma' quando nao ha assinatura ativa (ou o plano dela saiu do catalogo).
 */
export function relacaoComAtual(plano, atual) {
  if (!atual) return 'nenhuma';
  if (plano.id === atual.id) return 'atual';

  const alvo = nivelDe(plano);
  const vigente = nivelDe(atual);
  if (alvo > vigente) return 'upgrade';
  if (alvo < vigente) return 'downgrade';
  return 'lateral';
}

/** O plano do catalogo correspondente a assinatura ativa, se ainda existir. */
export function planoDaAssinatura(planos, assinatura) {
  if (!assinatura) return null;
  return planos.find((p) => p.id === assinatura.plano_codigo) ?? null;
}

/**
 * Devolve os planos com os campos que a view precisa para marcar o atual:
 *   relacao   nenhuma | atual | upgrade | downgrade | lateral
 *   atual     true no plano que o aluno ja assina
 *   rotulo    texto do botao
 *   diferenca variacao mensal em relacao ao plano vigente (null sem assinatura)
 */
export function decorarPlanos(planos, assinatura) {
  const atual = planoDaAssinatura(planos, assinatura);

  return planos.map((p) => {
    const relacao = relacaoComAtual(p, atual);
    const diferenca =
      atual && relacao !== 'atual' ? Number((p.preco - atual.preco).toFixed(2)) : null;

    return {
      ...p,
      relacao,
      atual: relacao === 'atual',
      rotulo: relacao === 'nenhuma' ? p.cta : ROTULOS[relacao],
      diferenca
    };
  });
}
