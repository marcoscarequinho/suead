// Edicao de planos pelo admin (preco, nome, chamada, beneficios...).
// Ao mudar o preco, liga preco_manual para o db:setup parar de sobrescrever
// esse valor com o que esta em src/data/planos.js no proximo deploy.

import { pool, temBanco } from '../db/pool.js';

export async function listarPlanosAdmin() {
  if (!temBanco) return [];
  const { rows } = await pool.query(
    `select codigo, nome, preco::float8 as preco, periodo, chamada, destaque, selo,
            beneficios, cta, ordem, nivel, preco_manual
       from planos order by ordem, id`
  );
  return rows;
}

export async function buscarPlanoAdmin(codigo) {
  if (!temBanco) return null;
  const { rows } = await pool.query(
    `select codigo, nome, preco::float8 as preco, periodo, chamada, destaque, selo,
            beneficios, cta, ordem, nivel, preco_manual
       from planos where codigo = $1`,
    [codigo]
  );
  return rows[0] ?? null;
}

export async function atualizarPlano(codigo, { nome, preco, chamada, beneficios, destaque, selo }) {
  if (!temBanco) throw new Error('Plano indisponível: banco não configurado.');
  const { rows } = await pool.query(
    `update planos set
       nome = $2,
       preco = $3,
       preco_manual = true,
       chamada = $4,
       beneficios = $5::jsonb,
       destaque = $6,
       selo = $7
     where codigo = $1
     returning *`,
    [codigo, nome, preco, chamada, JSON.stringify(beneficios), destaque, selo || null]
  );
  return rows[0] ?? null;
}
