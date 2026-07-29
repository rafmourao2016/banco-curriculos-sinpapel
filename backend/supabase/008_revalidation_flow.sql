-- Regua completa de revalidacao do curriculo:
-- 90 dias: envio de link; 120 dias: inativacao; 12 meses inativo: exclusao.

alter table candidatos
  add column if not exists data_inativacao timestamptz;

alter table notificacoes
  add column if not exists token_hash text unique,
  add column if not exists expira_em timestamptz,
  add column if not exists usado_em timestamptz,
  add column if not exists erro_envio text;

create index if not exists candidatos_ativo_revalidacao_idx
  on candidatos (ativo, data_ultima_revalidacao);

create index if not exists candidatos_data_inativacao_idx
  on candidatos (data_inativacao);

create index if not exists notificacoes_revalidacao_expira_idx
  on notificacoes (tipo, expira_em)
  where tipo = 'revalidacao';
