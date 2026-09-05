// Repositorio de alunos: cadastro, login e dados do painel.

import { pool, temBanco } from '../db/pool.js';
import { gerarHash, conferirSenha } from '../services/senha.js';

function exigirBanco() {
  if (!temBanco) throw new Error('Cadastro indisponível: banco de dados não configurado.');
}

export function normalizarEmail(email) {
  return String(email ?? '').trim().toLowerCase();
}

export async function buscarPorEmail(email) {
  exigirBanco();
  const { rows } = await pool.query(
    'select id, email, nome, senha_hash, ultimo_acesso, criado_em from alunos where email = $1',
    [normalizarEmail(email)]
  );
  return rows[0] ?? null;
}

export async function buscarPorId(id) {
  if (!temBanco || !id) return null;
  const { rows } = await pool.query(
    'select id, email, nome, ultimo_acesso, criado_em from alunos where id = $1',
    [id]
  );
  return rows[0] ?? null;
}

/** Cria a conta. Lanca erro amigavel se o e-mail ja existir. */
export async function criarAluno({ nome, email, senha }) {
  exigirBanco();
  const hash = await gerarHash(senha);

  try {
    const { rows } = await pool.query(
      `insert into alunos (nome, email, senha_hash, ultimo_acesso)
       values ($1, $2, $3, now())
       returning id, email, nome, criado_em`,
      [String(nome ?? '').trim() || null, normalizarEmail(email), hash]
    );
    return rows[0];
  } catch (erro) {
    if (erro.code === '23505') {
      const conflito = new Error('Este e-mail já tem cadastro. Faça login.');
      conflito.codigo = 'EMAIL_EM_USO';
      throw conflito;
    }
    throw erro;
  }
}

/** Confere e-mail e senha. Retorna o aluno ou null. */
export async function autenticar({ email, senha }) {
  const aluno = await buscarPorEmail(email);
  if (!aluno) {
    // Gasta o mesmo tempo de um hash real para não denunciar e-mails inexistentes.
    await conferirSenha(String(senha ?? ''), 'scrypt$16384$00$00');
    return null;
  }

  const confere = await conferirSenha(String(senha ?? ''), aluno.senha_hash);
  if (!confere) return null;

  await pool.query('update alunos set ultimo_acesso = now() where id = $1', [aluno.id]);
  delete aluno.senha_hash;
  return aluno;
}

/* ---------------- Painel do aluno ---------------- */

/** Ultimos nivelamentos do aluno, um por materia. */
export async function trilhaDoAluno(alunoId) {
  if (!temBanco || !alunoId) return [];
  const { rows } = await pool.query(
    `select distinct on (materia_slug)
            materia_slug, acertos, total, aproveitamento, nivel_sugerido, nivel_codigo, criado_em
       from nivelamentos
      where aluno_id = $1
      order by materia_slug, criado_em desc`,
    [alunoId]
  );
  return rows;
}

/** Ultimas duvidas feitas pelo aluno. */
export async function duvidasDoAluno(alunoId, limite = 5) {
  if (!temBanco || !alunoId) return [];
  const { rows } = await pool.query(
    `select materia_slug, nivel_codigo, pergunta, criado_em
       from duvidas
      where aluno_id = $1
      order by criado_em desc
      limit $2`,
    [alunoId, limite]
  );
  return rows;
}

export async function resumoDoAluno(alunoId) {
  if (!temBanco || !alunoId) return { duvidas: 0, nivelamentos: 0, materias: 0 };
  const { rows } = await pool.query(
    `select
       (select count(*)::int from duvidas where aluno_id = $1)                          as duvidas,
       (select count(*)::int from nivelamentos where aluno_id = $1)                     as nivelamentos,
       (select count(distinct materia_slug)::int from nivelamentos where aluno_id = $1) as materias`,
    [alunoId]
  );
  return rows[0];
}
