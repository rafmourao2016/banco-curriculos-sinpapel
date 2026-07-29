-- Busca semantica e API para ATS.
alter table candidatos
  add column if not exists embedding vector(1536);

create table if not exists empresas_api_keys (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id) on delete cascade,
  nome text not null,
  token_prefix text not null,
  token_hash text not null,
  ativo boolean not null default true,
  data_criacao timestamptz not null default now()
);

create index if not exists empresas_api_keys_prefix_idx
  on empresas_api_keys (token_prefix);

-- Ative este indice quando houver volume inicial de candidatos com embedding.
-- create index if not exists candidatos_embedding_ivfflat_idx
--   on candidatos using ivfflat (embedding vector_cosine_ops)
--   with (lists = 100);
