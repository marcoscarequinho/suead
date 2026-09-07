// Repositorio de isencoes: acesso gratuito concedido pelo admin a um aluno,
// sem prazo (fica ativo ate ser revogado). Escopo 'total' ou 'materia'.

import { pool, temBanco } from '../db/pool.js';

/** Isencao ativa do aluno, se houver (a mais recente). */
export async function isencaoAtiva(alunoId) {
  if (!temBanco || !alunoId) return null;
  const { rows } = await pool.query(
    `select * from isencoes
      where aluno_id = $1 and ativa
      order by criado_em desc limit 1`,
    [alunoId]
  );
  return rows[0] ?? null;
}

export async function listarIsencoesDoAluno(alunoId) {
  if (!temBanco || !alunoId) return [];
  const { rows } = await pool.query(
    `select i.*, admin.nome as concedida_por_nome
       from isencoes i
       left join alunos admin on admin.id = i.concedida_por
      where i.aluno_id = $1
      order by i.criado_em desc`,
    [alunoId]
  );
  return rows;
}

/** Concede isencao. Encerra qualquer isencao ativa anterior do aluno primeiro. */
export async function concederIsencao({ alunoId, escopo, materiaSlug, motivo, concedidaPor }) {
  if (!temBanco) throw new Error('Isenção indisponível: banco não configurado.');

  await pool.query(
    `update isencoes set ativa = false, revogada_em = now() where aluno_id = $1 and ativa`,
    [alunoId]
  );

  const { rows } = await pool.query(
    `insert into isencoes (aluno_id, escopo, materia_slug, motivo, concedida_por)
     values ($1, $2, $3, $4, $5)
     returning *`,
    [alunoId, escopo === 'materia' ? 'materia' : 'total', escopo === 'materia' ? materiaSlug : null,
     motivo || null, concedidaPor]
  );
  return rows[0];
}

export async function revogarIsencao(id) {
  if (!temBanco) return null;
  const { rows } = await pool.query(
    `update isencoes set ativa = false, revogada_em = now() where id = $1 returning *`,
    [id]
  );
  return rows[0] ?? null;
}
