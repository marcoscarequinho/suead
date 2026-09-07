// Repositorio de solicitacoes de troca da materia liberada pelo plano
// "Por Materia". Aluno pede, admin aprova ou recusa.

import { pool, temBanco } from '../db/pool.js';

export async function criarSolicitacao({ alunoId, assinaturaId, materiaAtual, materiaSolicitada, motivo }) {
  if (!temBanco) throw new Error('Solicitação indisponível: banco não configurado.');
  const { rows } = await pool.query(
    `insert into solicitacoes_troca (aluno_id, assinatura_id, materia_atual, materia_solicitada, motivo)
     values ($1, $2, $3, $4, $5)
     returning *`,
    [alunoId, assinaturaId ?? null, materiaAtual ?? null, materiaSolicitada, motivo || null]
  );
  return rows[0];
}

/** Solicitacao pendente mais recente do aluno, se houver. */
export async function solicitacaoPendenteDoAluno(alunoId) {
  if (!temBanco || !alunoId) return null;
  const { rows } = await pool.query(
    `select * from solicitacoes_troca
      where aluno_id = $1 and status = 'pendente'
      order by criado_em desc limit 1`,
    [alunoId]
  );
  return rows[0] ?? null;
}

export async function listarPendentes() {
  if (!temBanco) return [];
  const { rows } = await pool.query(
    `select s.*, a.nome as aluno_nome, a.email as aluno_email
       from solicitacoes_troca s
       join alunos a on a.id = s.aluno_id
      where s.status = 'pendente'
      order by s.criado_em asc`
  );
  return rows;
}

export async function buscarPorId(id) {
  if (!temBanco) return null;
  const { rows } = await pool.query('select * from solicitacoes_troca where id = $1', [id]);
  return rows[0] ?? null;
}

export async function responderSolicitacao(id, { status, respostaAdmin }) {
  if (!temBanco) return null;
  const { rows } = await pool.query(
    `update solicitacoes_troca
        set status = $2, resposta_admin = $3, respondido_em = now()
      where id = $1
      returning *`,
    [id, status, respostaAdmin || null]
  );
  return rows[0] ?? null;
}
