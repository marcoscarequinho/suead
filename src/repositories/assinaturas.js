// Repositorio de assinaturas.

import { pool, temBanco } from '../db/pool.js';

export async function criarAssinatura({
  alunoId, planoCodigo, planoNome, valor, parcelas, ciclo, referencia, preferenceId
}) {
  if (!temBanco) throw new Error('Assinatura indisponível: banco não configurado.');

  const { rows } = await pool.query(
    `insert into assinaturas
       (aluno_id, plano_codigo, plano_nome, valor, parcelas, ciclo, referencia, preference_id)
     values ($1, $2, $3, $4, $5, $6, $7, $8)
     returning *`,
    [alunoId, planoCodigo, planoNome, valor, parcelas, ciclo, referencia, preferenceId ?? null]
  );
  return rows[0];
}

export async function buscarPorReferencia(referencia) {
  if (!temBanco || !referencia) return null;
  const { rows } = await pool.query('select * from assinaturas where referencia = $1', [referencia]);
  return rows[0] ?? null;
}

/**
 * Encerra as outras assinaturas ativas do aluno quando uma nova e aprovada.
 *
 * Sem isso, um upgrade deixaria duas linhas 'ativa' no banco e o painel passaria
 * a depender da ordem de criacao para saber qual vale. As antigas viram
 * 'trocada' — status separado de 'cancelada', que e cancelamento de verdade.
 */
async function encerrarOutrasAtivas(cliente, alunoId, referenciaAtual) {
  const { rowCount } = await cliente.query(
    `update assinaturas set status = 'trocada', atualizado_em = now()
      where aluno_id = $1 and status = 'ativa' and referencia <> $2`,
    [alunoId, referenciaAtual]
  );
  if (rowCount) console.log(`[assinatura] ${rowCount} anterior(es) marcada(s) como trocada (aluno ${alunoId})`);
}

export async function atualizarPorReferencia(referencia, { status, pagamentoId, meioPagamento, detalhe }) {
  if (!temBanco) return null;
  const { rows } = await pool.query(
    `update assinaturas set
       status         = coalesce($2, status),
       pagamento_id   = coalesce($3, pagamento_id),
       meio_pagamento = coalesce($4, meio_pagamento),
       detalhe        = coalesce($5::jsonb, detalhe),
       atualizado_em  = now()
     where referencia = $1
     returning *`,
    [referencia, status ?? null, pagamentoId ?? null, meioPagamento ?? null,
     detalhe ? JSON.stringify(detalhe) : null]
  );

  const assinatura = rows[0] ?? null;
  if (assinatura?.status === 'ativa') {
    await encerrarOutrasAtivas(pool, assinatura.aluno_id, assinatura.referencia);
  }
  return assinatura;
}

/**
 * Assinaturas pendentes que valem uma consulta ao gateway.
 *
 * Filtra por janela (não adianta reconsultar checkout abandonado de semanas
 * atrás) e por intervalo desde a última verificação, para que abrir o painel
 * várias vezes não vire uma enxurrada de chamadas à API.
 */
export async function pendentesParaConciliar({
  alunoId = null,
  janelaDias = 7,
  intervaloMinutos = 10,
  limite = 5
} = {}) {
  if (!temBanco) return [];
  const { rows } = await pool.query(
    `select id, referencia, status, aluno_id
       from assinaturas
      where status = 'pendente'
        and criado_em > now() - ($1 || ' days')::interval
        and (verificado_em is null or verificado_em < now() - ($2 || ' minutes')::interval)
        and ($3::int is null or aluno_id = $3::int)
      order by criado_em desc
      limit $4`,
    [String(janelaDias), String(intervaloMinutos), alunoId, limite]
  );
  return rows;
}

export async function marcarVerificada(referencia) {
  if (!temBanco) return;
  await pool.query('update assinaturas set verificado_em = now() where referencia = $1', [
    referencia
  ]);
}

/** Assinatura ativa do aluno, se houver. */
export async function assinaturaAtiva(alunoId) {
  if (!temBanco || !alunoId) return null;
  const { rows } = await pool.query(
    `select * from assinaturas
      where aluno_id = $1 and status = 'ativa'
      order by criado_em desc limit 1`,
    [alunoId]
  );
  return rows[0] ?? null;
}

export async function historicoDoAluno(alunoId, limite = 10) {
  if (!temBanco || !alunoId) return [];
  const { rows } = await pool.query(
    `select plano_nome, valor, parcelas, ciclo, status, meio_pagamento, criado_em
       from assinaturas where aluno_id = $1
      order by criado_em desc limit $2`,
    [alunoId, limite]
  );
  return rows;
}
