alter table candidatos
  add column if not exists uf text,
  add column if not exists interesse_jovem_aprendiz boolean not null default false,
  add column if not exists cep text,
  add column if not exists logradouro text,
  add column if not exists bairro text,
  add column if not exists numero_endereco text,
  add column if not exists complemento_endereco text;

create index if not exists candidatos_uf_idx
  on candidatos (uf);
