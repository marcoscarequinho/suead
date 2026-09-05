-- =========================================================
-- EducaAI — esquema do banco (Postgres / Neon)
-- Idempotente: pode ser executado quantas vezes for preciso.
-- =========================================================

-- ---------- Conteudo ----------

create table if not exists materias (
  id          serial primary key,
  slug        text not null unique,
  nome        text not null,
  icone       text not null,
  cor         text not null,
  avatar      text not null,
  resumo      text not null,
  ordem       integer not null default 0,
  criado_em   timestamptz not null default now()
);

create table if not exists niveis (
  id          serial primary key,
  materia_id  integer not null references materias(id) on delete cascade,
  codigo      text not null,                 -- basico | intermediario | avancado
  nome        text not null,
  descricao   text not null,
  duracao     text not null,
  ordem       integer not null default 0,
  unique (materia_id, codigo)
);

-- Cursos de idioma: lingua-alvo da materia e frases de pronuncia por nivel.
alter table materias add column if not exists idioma text;
alter table niveis   add column if not exists expressoes jsonb not null default '[]'::jsonb;

create table if not exists topicos (
  id          serial primary key,
  nivel_id    integer not null references niveis(id) on delete cascade,
  titulo      text not null,
  ordem       integer not null default 0
);

create table if not exists planos (
  id          serial primary key,
  codigo      text not null unique,
  nome        text not null,
  preco       numeric(10,2) not null,
  periodo     text not null,
  chamada     text not null,
  destaque    boolean not null default false,
  selo        text,
  beneficios  jsonb not null default '[]'::jsonb,
  cta         text not null,
  ordem       integer not null default 0
);
alter table planos add column if not exists nivel integer not null default 0;

create table if not exists depoimentos (
  id          serial primary key,
  nome        text not null,
  perfil      text not null,
  materia     text not null,
  nivel_de    text not null,
  nivel_para  text not null,
  meses       integer not null,
  texto       text not null,
  publicado   boolean not null default true,
  ordem       integer not null default 0
);

-- ---------- Alunos e uso da plataforma ----------

create table if not exists alunos (
  id            serial primary key,
  email         text not null unique,
  nome          text,
  senha_hash    text,
  ultimo_acesso timestamptz,
  criado_em     timestamptz not null default now()
);

-- Colunas de autenticacao para bancos criados antes do login existir.
alter table alunos add column if not exists senha_hash    text;
alter table alunos add column if not exists ultimo_acesso timestamptz;

-- Sessoes de login (connect-pg-simple).
create table if not exists sessoes (
  sid    varchar primary key,
  sess   json not null,
  expire timestamptz not null
);
create index if not exists idx_sessoes_expire on sessoes (expire);

create table if not exists nivelamentos (
  id            serial primary key,
  aluno_id      integer references alunos(id) on delete set null,
  materia_slug  text not null,
  acertos       integer not null,
  total         integer not null,
  aproveitamento integer not null,
  nivel_sugerido text not null,
  criado_em     timestamptz not null default now()
);

alter table nivelamentos add column if not exists nivel_codigo text;

create table if not exists duvidas (
  id            serial primary key,
  aluno_id      integer references alunos(id) on delete set null,
  materia_slug  text not null,
  nivel_codigo  text,
  topico        text,
  pergunta      text not null,
  resposta      text,
  modo          text not null default 'simulado',
  criado_em     timestamptz not null default now()
);

create table if not exists progresso (
  id            serial primary key,
  aluno_id      integer not null references alunos(id) on delete cascade,
  materia_slug  text not null,
  nivel_codigo  text not null,
  concluidos    integer not null default 0,
  atualizado_em timestamptz not null default now(),
  unique (aluno_id, materia_slug)
);

-- ---------- Pagamentos (Mercado Pago) ----------

create table if not exists assinaturas (
  id             serial primary key,
  aluno_id       integer not null references alunos(id) on delete cascade,
  plano_codigo   text not null,
  plano_nome     text not null,
  valor          numeric(10,2) not null,
  parcelas       integer not null default 1,
  ciclo          text not null default 'mensal',      -- mensal | anual
  status         text not null default 'pendente',    -- pendente | ativa | recusada | cancelada | trocada
  referencia     text not null unique,                -- external_reference enviado ao gateway
  preference_id  text,
  pagamento_id   text,
  meio_pagamento text,
  detalhe        jsonb,
  criado_em      timestamptz not null default now(),
  atualizado_em  timestamptz not null default now()
);

-- Ultima consulta de conciliacao ao gateway (evita reconsultar a cada acesso).
alter table assinaturas add column if not exists verificado_em timestamptz;

-- ---------- Indices ----------

create index if not exists idx_assinaturas_aluno  on assinaturas (aluno_id, criado_em desc);
create index if not exists idx_assinaturas_status on assinaturas (status);

create index if not exists idx_niveis_materia    on niveis (materia_id, ordem);
create index if not exists idx_topicos_nivel     on topicos (nivel_id, ordem);
create index if not exists idx_nivelamentos_data on nivelamentos (criado_em desc);
create index if not exists idx_duvidas_data      on duvidas (criado_em desc);
create index if not exists idx_duvidas_materia   on duvidas (materia_slug, criado_em desc);
