-- Politicas base para Supabase.
-- O backend NestJS deve usar DATABASE_URL segura no servidor, nunca no frontend.

alter table candidatos enable row level security;
alter table experiencias enable row level security;
alter table formacoes enable row level security;
alter table termos_consentimento enable row level security;
alter table empresas enable row level security;
alter table usuarios_empresa enable row level security;
alter table vagas_necessidade enable row level security;
alter table status_contratacao enable row level security;
alter table logs_visualizacao enable row level security;
alter table notificacoes enable row level security;
alter table habilidades enable row level security;
alter table candidatos_habilidades enable row level security;

-- Sem policies publicas por enquanto: evita exposicao via Supabase API anon.
-- A aplicacao acessa os dados pelo backend, com regras de autorizacao do NestJS.
