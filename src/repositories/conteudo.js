// Repositorio de conteudo.
//
// Le materias, planos e depoimentos do Postgres e mantem um cache em memoria
// (o conteudo muda raramente e e usado em toda requisicao). Se o banco estiver
// indisponivel, cai para os arquivos de src/data — o site nunca fica fora do ar
// por causa do banco.

import { pool, temBanco } from '../db/pool.js';
import { materias as materiasSeed } from '../data/materias.js';
import { planos as planosSeed } from '../data/planos.js';
import { depoimentos as depoimentosSeed } from '../data/depoimentos.js';

const cache = {
  materias: null,
  planos: null,
  depoimentos: null,
  origem: 'arquivo',
  carregadoEm: null
};

export function origemDados() {
  return cache.origem;
}

/** Carrega (ou recarrega) o conteudo do banco para o cache. */
export async function carregarConteudo() {
  if (!temBanco) {
    aplicarSeed('arquivo (DATABASE_URL ausente)');
    return cache;
  }

  try {
    const [materias, planos, depoimentos] = await Promise.all([
      lerMaterias(),
      lerPlanos(),
      lerDepoimentos()
    ]);

    if (!materias.length) {
      aplicarSeed('arquivo (banco vazio — rode npm run db:setup)');
      return cache;
    }

    cache.materias = materias;
    cache.planos = planos.length ? planos : planosSeed;
    cache.depoimentos = depoimentos.length ? depoimentos : depoimentosSeed;
    cache.origem = 'postgres';
    cache.carregadoEm = new Date();
  } catch (erro) {
    console.error('[conteudo] falha ao ler do banco:', erro.message);
    aplicarSeed('arquivo (falha na leitura do banco)');
  }
  return cache;
}

function aplicarSeed(motivo) {
  cache.materias = materiasSeed;
  cache.planos = planosSeed;
  cache.depoimentos = depoimentosSeed;
  cache.origem = motivo;
  cache.carregadoEm = new Date();
}

async function garantirCache() {
  if (!cache.materias) await carregarConteudo();
}

/* ---------------- Leitura ---------------- */

async function lerMaterias() {
  const { rows } = await pool.query(`
    select
      m.slug, m.nome, m.icone, m.cor, m.avatar, m.resumo, m.idioma,
      coalesce(
        jsonb_agg(
          jsonb_build_object(
            'id', n.codigo,
            'nome', n.nome,
            'descricao', n.descricao,
            'duracao', n.duracao,
            'expressoes', coalesce(n.expressoes, '[]'::jsonb),
            'topicos', coalesce(t.titulos, '[]'::jsonb)
          ) order by n.ordem
        ) filter (where n.id is not null),
        '[]'::jsonb
      ) as niveis
    from materias m
    left join niveis n on n.materia_id = m.id
    left join lateral (
      select jsonb_agg(tp.titulo order by tp.ordem) as titulos
      from topicos tp where tp.nivel_id = n.id
    ) t on true
    group by m.id
    order by m.ordem, m.id
  `);
  return rows;
}

async function lerPlanos() {
  const { rows } = await pool.query(
    `select codigo as id, nome, preco::float8 as preco, periodo, chamada,
            destaque, selo, beneficios, cta, nivel
       from planos order by ordem, id`
  );
  return rows;
}

async function lerDepoimentos() {
  const { rows } = await pool.query(
    `select nome, perfil, materia, nivel_de as de, nivel_para as para, meses, texto
       from depoimentos where publicado order by ordem, id`
  );
  return rows;
}

/* ---------------- API do repositorio ---------------- */

export async function listarMaterias() {
  await garantirCache();
  return cache.materias;
}

export async function buscarMateria(slug) {
  await garantirCache();
  return cache.materias.find((m) => m.slug === slug) ?? null;
}

export async function listarPlanos() {
  await garantirCache();
  return cache.planos;
}

export async function listarDepoimentos() {
  await garantirCache();
  return cache.depoimentos;
}

/* ---------------- Escrita (uso da plataforma) ---------------- */

/** Registra o resultado de um teste de nivelamento. */
export async function registrarNivelamento({ alunoId, materiaSlug, acertos, total, aproveitamento, nivelSugerido, nivelCodigo }) {
  if (!temBanco) return null;
  try {
    const { rows } = await pool.query(
      `insert into nivelamentos (aluno_id, materia_slug, acertos, total, aproveitamento, nivel_sugerido, nivel_codigo)
       values ($1, $2, $3, $4, $5, $6, $7) returning id, criado_em`,
      [alunoId ?? null, materiaSlug, acertos, total, aproveitamento, nivelSugerido, nivelCodigo ?? null]
    );
    return rows[0];
  } catch (erro) {
    console.error('[nivelamento] não registrado:', erro.message);
    return null;
  }
}

/** Registra uma duvida feita ao professor de IA e a resposta devolvida. */
export async function registrarDuvida({ alunoId, materiaSlug, nivelCodigo, topico, pergunta, resposta, modo }) {
  if (!temBanco) return null;
  try {
    const { rows } = await pool.query(
      `insert into duvidas (aluno_id, materia_slug, nivel_codigo, topico, pergunta, resposta, modo)
       values ($1, $2, $3, $4, $5, $6, $7) returning id, criado_em`,
      [alunoId ?? null, materiaSlug ?? null, nivelCodigo ?? null, topico ?? null, pergunta, resposta ?? null, modo ?? 'simulado']
    );
    return rows[0];
  } catch (erro) {
    console.error('[dúvida] não registrada:', erro.message);
    return null;
  }
}

/** Numeros agregados para a area do aluno / painel. */
export async function estatisticas() {
  if (!temBanco) return null;
  try {
    const { rows } = await pool.query(`
      select
        (select count(*)::int from duvidas)      as duvidas,
        (select count(*)::int from nivelamentos) as nivelamentos,
        (select count(*)::int from materias)     as materias
    `);
    return rows[0];
  } catch (erro) {
    return null;
  }
}
