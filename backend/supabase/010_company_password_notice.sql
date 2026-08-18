alter table empresas
  add column if not exists data_cadastro timestamptz not null default now(),
  add column if not exists data_ultimo_aviso_senha timestamptz;

create index if not exists empresas_data_cadastro_idx
  on empresas (data_cadastro);

create index if not exists empresas_data_ultimo_aviso_senha_idx
  on empresas (data_ultimo_aviso_senha);
