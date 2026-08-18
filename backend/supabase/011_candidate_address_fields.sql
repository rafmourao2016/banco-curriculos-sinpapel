alter table candidatos
  add column if not exists cep text,
  add column if not exists logradouro text,
  add column if not exists bairro text,
  add column if not exists numero_endereco text,
  add column if not exists complemento_endereco text;

create index if not exists candidatos_cep_idx
  on candidatos (cep);

create index if not exists candidatos_bairro_idx
  on candidatos (bairro);
