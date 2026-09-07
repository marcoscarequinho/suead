// Cria o esquema e popula o banco com o conteudo inicial.
//   npm run db:setup
//
// Idempotente: usa upsert por slug/codigo, entao pode rodar de novo depois de
// editar os arquivos de src/data.

import 'dotenv/config';
import path from 'node:path';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

import { pool, temBanco, verificarConexao, encerrar } from './pool.js';
import { materias } from '../data/materias.js';
import { planos } from '../data/planos.js';
import { depoimentos } from '../data/depoimentos.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  if (!temBanco) {
    console.error('DATABASE_URL não configurada no .env — nada a fazer.');
    process.exit(1);
  }

  const conexao = await verificarConexao();
  if (!conexao.ok) {
    console.error('Falha ao conectar:', conexao.motivo);
    process.exit(1);
  }
  console.log('Conectado:', conexao.versao);

  const sql = await readFile(path.join(__dirname, 'schema.sql'), 'utf8');
  await pool.query(sql);
  console.log('Esquema aplicado.');

  const cliente = await pool.connect();
  try {
    await cliente.query('begin');

    // ----- Matérias, níveis e tópicos -----
    for (const [i, m] of materias.entries()) {
      const { rows } = await cliente.query(
        `insert into materias (slug, nome, icone, cor, avatar, resumo, ordem, idioma, aviso)
         values ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         on conflict (slug) do update set
           nome = excluded.nome, icone = excluded.icone, cor = excluded.cor,
           avatar = excluded.avatar, resumo = excluded.resumo, ordem = excluded.ordem,
           idioma = excluded.idioma, aviso = excluded.aviso
         returning id`,
        [m.slug, m.nome, m.icone, m.cor, m.avatar, m.resumo, i, m.idioma ?? null, m.aviso ?? null]
      );
      const materiaId = rows[0].id;

      for (const [j, n] of m.niveis.entries()) {
        const nivel = await cliente.query(
          `insert into niveis (materia_id, codigo, nome, descricao, duracao, ordem, expressoes)
           values ($1, $2, $3, $4, $5, $6, $7::jsonb)
           on conflict (materia_id, codigo) do update set
             nome = excluded.nome, descricao = excluded.descricao,
             duracao = excluded.duracao, ordem = excluded.ordem,
             expressoes = excluded.expressoes
           returning id`,
          [materiaId, n.id, n.nome, n.descricao, n.duracao, j, JSON.stringify(n.expressoes ?? [])]
        );
        const nivelId = nivel.rows[0].id;

        // Tópicos são substituídos por completo (lista curta e ordenada).
        await cliente.query('delete from topicos where nivel_id = $1', [nivelId]);
        for (const [k, t] of n.topicos.entries()) {
          await cliente.query(
            'insert into topicos (nivel_id, titulo, ordem) values ($1, $2, $3)',
            [nivelId, t, k]
          );
        }
      }
    }
    console.log(`Matérias sincronizadas: ${materias.length}`);

    // ----- Planos -----
    for (const [i, p] of planos.entries()) {
      await cliente.query(
        `insert into planos (codigo, nome, preco, periodo, chamada, destaque, selo, beneficios, cta, ordem, nivel)
         values ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9, $10, $11)
         on conflict (codigo) do update set
           nome = excluded.nome,
           preco = case when planos.preco_manual then planos.preco else excluded.preco end,
           periodo = excluded.periodo,
           chamada = excluded.chamada, destaque = excluded.destaque, selo = excluded.selo,
           beneficios = excluded.beneficios, cta = excluded.cta, ordem = excluded.ordem,
           nivel = excluded.nivel`,
        [p.id, p.nome, p.preco, p.periodo, p.chamada, p.destaque, p.selo ?? null,
         JSON.stringify(p.beneficios), p.cta, i, p.nivel ?? 0]
      );
    }
    console.log(`Planos sincronizados: ${planos.length}`);

    // ----- Depoimentos -----
    const { rows: contagem } = await cliente.query('select count(*)::int as n from depoimentos');
    if (contagem[0].n === 0) {
      for (const [i, d] of depoimentos.entries()) {
        await cliente.query(
          `insert into depoimentos (nome, perfil, materia, nivel_de, nivel_para, meses, texto, ordem)
           values ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [d.nome, d.perfil, d.materia, d.de, d.para, d.meses, d.texto, i]
        );
      }
      console.log(`Depoimentos inseridos: ${depoimentos.length}`);
    } else {
      console.log(`Depoimentos já existentes: ${contagem[0].n} (mantidos)`);
    }

    await cliente.query('commit');
  } catch (erro) {
    await cliente.query('rollback');
    throw erro;
  } finally {
    cliente.release();
  }

  console.log('\nBanco pronto.');
  await encerrar();
}

main().catch(async (erro) => {
  console.error('Falha no setup:', erro);
  await encerrar();
  process.exit(1);
});
