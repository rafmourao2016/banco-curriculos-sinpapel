-- Complementos do briefing:
-- status contratado com data de admissao/comentario e filtros adicionais da empresa.

alter table status_contratacao
  add column if not exists data_admissao timestamptz,
  add column if not exists comentario text;

create index if not exists candidatos_turnos_gin_idx
  on candidatos using gin (turnos);

create index if not exists candidatos_pretensao_salarial_idx
  on candidatos (pretensao_salarial);

create index if not exists candidatos_inicio_imediato_idx
  on candidatos (inicio_imediato);

create index if not exists candidatos_cursos_certificacoes_gin_idx
  on candidatos using gin (cursos_certificacoes);
