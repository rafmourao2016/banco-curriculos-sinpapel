alter table candidatos
  add column if not exists interesse_jovem_aprendiz boolean not null default false;
