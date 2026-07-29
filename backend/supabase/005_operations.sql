-- Operacao do painel empresa/admin.
-- Garante um unico status por candidato em cada empresa.
create unique index if not exists status_contratacao_candidato_empresa_uidx
  on status_contratacao (candidato_id, empresa_id);

create index if not exists empresas_status_aprovacao_idx
  on empresas (status_aprovacao);

create index if not exists logs_visualizacao_data_hora_idx
  on logs_visualizacao (data_hora desc);

create index if not exists notificacoes_tipo_status_idx
  on notificacoes (tipo, status_envio);
