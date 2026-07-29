-- Schema inicial do Banco de Curriculos SINPAPEL para Supabase/Postgres.
-- Rode depois de 001_extensions.sql.

do $$ begin
  create type "Escolaridade" as enum (
    'FUNDAMENTAL_INCOMPLETO',
    'FUNDAMENTAL_COMPLETO',
    'MEDIO_INCOMPLETO',
    'MEDIO_COMPLETO',
    'SUPERIOR_INCOMPLETO',
    'SUPERIOR_COMPLETO',
    'POS_GRADUACAO'
  );
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type "StatusCandidatura" as enum (
    'CONTATADO',
    'EM_PROCESSO_SELETIVO',
    'CONTRATADO',
    'NAO_COMPATIVEL'
  );
exception
  when duplicate_object then null;
end $$;

create table if not exists candidatos (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  cpf text not null unique,
  email text not null unique,
  telefone text not null,
  data_nascimento timestamptz not null,
  regiao text not null,
  escolaridade "Escolaridade" not null,
  possui_cnh boolean not null default false,
  categoria_cnh text,
  senha_hash text not null,
  ativo boolean not null default true,
  data_cadastro timestamptz not null default now(),
  data_ultima_revalidacao timestamptz not null default now()
);

create table if not exists experiencias (
  id uuid primary key default gen_random_uuid(),
  candidato_id uuid not null references candidatos(id) on delete cascade,
  cargo text not null,
  area text not null,
  data_inicio timestamptz not null,
  data_fim timestamptz,
  descricao text
);

create table if not exists formacoes (
  id uuid primary key default gen_random_uuid(),
  candidato_id uuid not null references candidatos(id) on delete cascade,
  nivel text not null,
  curso text not null,
  instituicao text not null,
  status text not null check (status in ('concluido', 'cursando', 'trancado'))
);

create table if not exists termos_consentimento (
  id uuid primary key default gen_random_uuid(),
  candidato_id uuid not null unique references candidatos(id) on delete cascade,
  versao text not null,
  data_aceite timestamptz not null default now(),
  ip text not null
);

create table if not exists empresas (
  id uuid primary key default gen_random_uuid(),
  razao_social text not null,
  cnpj text not null unique,
  email text not null unique,
  senha_hash text not null,
  status_aprovacao text not null default 'pendente',
  two_fa_ativo boolean not null default false,
  two_fa_secret text
);

create table if not exists usuarios_empresa (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id) on delete cascade,
  nome text not null,
  email text not null unique,
  papel text not null default 'operador'
);

create table if not exists vagas_necessidade (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id) on delete cascade,
  area text not null,
  requisitos text not null,
  ativa boolean not null default true
);

create table if not exists status_contratacao (
  id uuid primary key default gen_random_uuid(),
  candidato_id uuid not null references candidatos(id) on delete cascade,
  empresa_id uuid not null references empresas(id) on delete cascade,
  status "StatusCandidatura" not null default 'CONTATADO',
  data_atualizacao timestamptz not null default now()
);

create table if not exists logs_visualizacao (
  id uuid primary key default gen_random_uuid(),
  candidato_id uuid not null references candidatos(id) on delete cascade,
  empresa_id uuid not null references empresas(id) on delete cascade,
  data_hora timestamptz not null default now()
);

create table if not exists notificacoes (
  id uuid primary key default gen_random_uuid(),
  candidato_id uuid not null references candidatos(id) on delete cascade,
  tipo text not null,
  canal text not null,
  status_envio text not null default 'pendente',
  data_envio timestamptz not null default now()
);

create table if not exists habilidades (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique,
  embedding vector(1536)
);

create table if not exists candidatos_habilidades (
  candidato_id uuid not null references candidatos(id) on delete cascade,
  habilidade_id uuid not null references habilidades(id) on delete cascade,
  primary key (candidato_id, habilidade_id)
);

create index if not exists candidatos_ativos_idx on candidatos (ativo);
create index if not exists candidatos_regiao_idx on candidatos (regiao);
create index if not exists candidatos_escolaridade_idx on candidatos (escolaridade);
create index if not exists experiencias_area_idx on experiencias (area);
create index if not exists habilidades_nome_idx on habilidades (nome);
create index if not exists vagas_necessidade_ativas_idx on vagas_necessidade (ativa);

-- Use ivfflat somente depois de inserir volume inicial relevante de embeddings.
-- create index if not exists habilidades_embedding_ivfflat_idx
--   on habilidades using ivfflat (embedding vector_cosine_ops)
--   with (lists = 100);
