// Repositorio do chat de suporte: conversa aluno <-> admin (nao a IA).
// Uma conversa continua por aluno; sem websocket, o front faz polling.

import { pool, temBanco } from '../db/pool.js';

/** Busca a conversa do aluno ou cria uma nova se ainda nao existir. */
export async function conversaDoAluno(alunoId) {
  if (!temBanco) return null;
  const existente = await pool.query('select * from conversas_suporte where aluno_id = $1', [alunoId]);
  if (existente.rows[0]) return existente.rows[0];

  const { rows } = await pool.query(
    `insert into conversas_suporte (aluno_id) values ($1)
     on conflict (aluno_id) do update set aluno_id = excluded.aluno_id
     returning *`,
    [alunoId]
  );
  return rows[0];
}

export async function buscarConversa(id) {
  if (!temBanco) return null;
  const { rows } = await pool.query(
    `select c.*, a.nome as aluno_nome, a.email as aluno_email
       from conversas_suporte c join alunos a on a.id = c.aluno_id
      where c.id = $1`,
    [id]
  );
  return rows[0] ?? null;
}

export async function mensagensDaConversa(conversaId) {
  if (!temBanco) return [];
  const { rows } = await pool.query(
    `select * from mensagens_suporte where conversa_id = $1 order by criado_em asc`,
    [conversaId]
  );
  return rows;
}

export async function enviarMensagem({ conversaId, remetente, texto }) {
  if (!temBanco) throw new Error('Chat indisponível: banco não configurado.');
  const { rows } = await pool.query(
    `insert into mensagens_suporte (conversa_id, remetente, texto) values ($1, $2, $3) returning *`,
    [conversaId, remetente, texto]
  );
  await pool.query('update conversas_suporte set atualizado_em = now() where id = $1', [conversaId]);
  return rows[0];
}

/** Marca como lidas as mensagens que NAO foram enviadas por `remetente` (quem esta lendo agora). */
export async function marcarLidas(conversaId, remetente) {
  if (!temBanco) return;
  await pool.query(
    `update mensagens_suporte set lida = true
      where conversa_id = $1 and remetente <> $2 and not lida`,
    [conversaId, remetente]
  );
}

/** Inbox do admin: conversas com a ultima mensagem e contagem de nao lidas do lado do aluno. */
export async function listarConversas() {
  if (!temBanco) return [];
  const { rows } = await pool.query(`
    select c.id, c.status, c.criado_em, c.atualizado_em,
           a.nome as aluno_nome, a.email as aluno_email,
           ultima.texto as ultima_mensagem, ultima.remetente as ultimo_remetente,
           coalesce(nao_lidas.total, 0) as nao_lidas
      from conversas_suporte c
      join alunos a on a.id = c.aluno_id
      left join lateral (
        select texto, remetente from mensagens_suporte
         where conversa_id = c.id order by criado_em desc limit 1
      ) ultima on true
      left join lateral (
        select count(*)::int as total from mensagens_suporte
         where conversa_id = c.id and remetente = 'aluno' and not lida
      ) nao_lidas on true
     order by c.atualizado_em desc
  `);
  return rows;
}
