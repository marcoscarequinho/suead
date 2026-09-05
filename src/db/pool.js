// Conexao com o Postgres (Neon).
// A URL vem sempre do .env — nunca fica no codigo.

import pg from 'pg';

const { DATABASE_URL } = process.env;

export const temBanco = Boolean(DATABASE_URL);

export const pool = temBanco
  ? new pg.Pool({
      connectionString: DATABASE_URL,
      // Neon usa certificado de CA publica: mantemos a verificacao ligada.
      ssl: { rejectUnauthorized: true },
      max: 5,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 10_000
    })
  : null;

if (pool) {
  pool.on('error', (erro) => {
    console.error('[db] erro no pool ocioso:', erro.message);
  });
}

/** Executa uma query. Retorna null se nao houver banco configurado. */
export async function consultar(texto, valores = []) {
  if (!pool) return null;
  return pool.query(texto, valores);
}

/** Testa a conexao no boot da aplicacao. */
export async function verificarConexao() {
  if (!pool) return { ok: false, motivo: 'DATABASE_URL não configurada' };
  try {
    const { rows } = await pool.query('select version() as versao, now() as agora');
    return { ok: true, versao: rows[0].versao.split(',')[0], agora: rows[0].agora };
  } catch (erro) {
    return { ok: false, motivo: erro.message };
  }
}

export async function encerrar() {
  if (pool) await pool.end();
}
