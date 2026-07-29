-- Recuperacao de senha por link de uso unico.
create table if not exists recuperacoes_senha (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  tipo text not null check (tipo in ('candidato', 'empresa')),
  token_hash text not null unique,
  expira_em timestamptz not null,
  usado_em timestamptz,
  criado_em timestamptz not null default now()
);

create index if not exists recuperacoes_senha_email_tipo_idx
  on recuperacoes_senha (email, tipo);

create index if not exists recuperacoes_senha_expira_em_idx
  on recuperacoes_senha (expira_em);
