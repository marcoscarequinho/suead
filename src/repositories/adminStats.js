// Numeros do painel admin.

import { pool, temBanco } from '../db/pool.js';

export async function resumoAdmin() {
  if (!temBanco) return null;
  const { rows } = await pool.query(`
    select
      (select count(*)::int from alunos where tipo = 'aluno')                          as alunos,
      (select count(*)::int from assinaturas where status = 'ativa')                    as assinaturas_ativas,
      (select count(*)::int from isencoes where ativa)                                  as isencoes_ativas,
      (select count(*)::int from solicitacoes_troca where status = 'pendente')          as solicitacoes_pendentes,
      (select count(*)::int from mensagens_suporte where remetente = 'aluno' and not lida) as mensagens_nao_lidas,
      (select count(*)::int from forum_topicos)                                         as topicos_forum
  `);
  return rows[0];
}

export async function assinaturasAtivasPorPlano() {
  if (!temBanco) return [];
  const { rows } = await pool.query(`
    select plano_codigo, plano_nome, count(*)::int as total
      from assinaturas
     where status = 'ativa'
     group by plano_codigo, plano_nome
     order by total desc
  `);
  return rows;
}
