// Repositorio do forum de interacao entre alunos.

import { pool, temBanco } from '../db/pool.js';

export async function listarTopicos({ limite = 50 } = {}) {
  if (!temBanco) return [];
  const { rows } = await pool.query(
    `select t.id, t.titulo, t.corpo, t.fixado, t.criado_em,
            a.nome as autor_nome, a.email as autor_email,
            (select count(*)::int from forum_respostas r where r.topico_id = t.id) as total_respostas
       from forum_topicos t
       left join alunos a on a.id = t.aluno_id
      order by t.fixado desc, t.criado_em desc
      limit $1`,
    [limite]
  );
  return rows;
}

export async function buscarTopico(id) {
  if (!temBanco) return null;
  const { rows } = await pool.query(
    `select t.*, a.nome as autor_nome, a.email as autor_email
       from forum_topicos t
       left join alunos a on a.id = t.aluno_id
      where t.id = $1`,
    [id]
  );
  const topico = rows[0] ?? null;
  if (!topico) return null;

  const respostas = await pool.query(
    `select r.*, a.nome as autor_nome, a.email as autor_email
       from forum_respostas r
       left join alunos a on a.id = r.aluno_id
      where r.topico_id = $1
      order by r.criado_em asc`,
    [id]
  );
  return { ...topico, respostas: respostas.rows };
}

export async function criarTopico({ alunoId, titulo, corpo }) {
  if (!temBanco) throw new Error('Fórum indisponível: banco não configurado.');
  const { rows } = await pool.query(
    `insert into forum_topicos (aluno_id, titulo, corpo) values ($1, $2, $3) returning *`,
    [alunoId, titulo, corpo]
  );
  return rows[0];
}

export async function criarResposta({ topicoId, alunoId, corpo }) {
  if (!temBanco) throw new Error('Fórum indisponível: banco não configurado.');
  const { rows } = await pool.query(
    `insert into forum_respostas (topico_id, aluno_id, corpo) values ($1, $2, $3) returning *`,
    [topicoId, alunoId, corpo]
  );
  return rows[0];
}

export async function excluirTopico(id) {
  if (!temBanco) return;
  await pool.query('delete from forum_topicos where id = $1', [id]);
}

export async function excluirResposta(id) {
  if (!temBanco) return;
  await pool.query('delete from forum_respostas where id = $1', [id]);
}
