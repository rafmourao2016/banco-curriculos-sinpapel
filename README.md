# Banco de Curriculos do SINPAPEL

MVP inicial do banco de curriculos, alinhado a stack definida no briefing.

## Stack alvo

- Frontend: Next.js + React + TypeScript, Tailwind CSS, React Hook Form e Zod.
- Backend: Node.js + NestJS + TypeScript.
- Banco principal: Supabase Postgres com pgvector.
- Filas/cache: Redis + BullMQ nas proximas fases.
- PDF: Puppeteer ou react-pdf na Fase 2.
- Deploy do frontend: Vercel.
- Backend/workers: Railway, Render ou AWS ECS/Fargate. O NestJS nao deve expor credenciais do Supabase no frontend.

## O que ja esta implementado

- Cadastro publico do candidato em `/cadastro`.
- Validacao mobile-first com React Hook Form + Zod.
- Backend NestJS com Prisma.
- `POST /candidatos`: cadastro publico com dados estruturados.
- `POST /auth/candidato/login`: login com senha hash Argon2id.
- `GET /candidatos/me`: candidato autenticado acessa apenas o proprio perfil.
- `PATCH /candidatos/me/confirmar-disponibilidade`: base para revalidacao de 90 dias.
- `DELETE /candidatos/me`: exclusao imediata dos dados pessoais.
- Scripts SQL para Supabase em `backend/supabase`.

## Supabase

Projeto Supabase configurado:

```text
https://iqfnmlyogzznjybylhug.supabase.co
```

Execute os scripts nesta ordem pelo SQL Editor:

1. `backend/supabase/001_extensions.sql`
2. `backend/supabase/002_schema.sql`
3. `backend/supabase/003_security.sql`
4. `backend/supabase/004_briefing_fields.sql`
5. `backend/supabase/005_operations.sql`
6. `backend/supabase/006_semantic_ats.sql`
7. `backend/supabase/007_password_reset.sql`
8. `backend/supabase/008_revalidation_flow.sql`
9. `backend/supabase/009_company_status_filters.sql`

Depois configure o backend:

```bash
cd backend
cp .env.example .env
```

Preencha `DATABASE_URL` com a connection string do Supabase. Para ambiente hospedado, prefira a URL de pooler.
Para a regua de revalidacao por e-mail, configure tambem `RESEND_API_KEY`, `EMAIL_FROM` e `API_PUBLIC_URL` com a URL publica do backend.

## Indicadores e backup

O painel administrativo possui indicadores executivos em `/admin`:

- taxa de revalidacao;
- ranking de uso por empresa;
- contratacoes por periodo;
- exportacao Excel em `GET /admin/indicadores/exportar`.

Para testar backup e restauracao em ambiente controlado:

```powershell
cd backend
$env:DIRECT_URL="postgresql://origem"
$env:RESTORE_DATABASE_URL="postgresql://banco_restore_teste"
$env:BACKUP_PASSPHRASE="frase-forte"
.\scripts\backup-restore-test.ps1 -AllowRestore
```

Use apenas banco descartavel de teste para `RESTORE_DATABASE_URL`. O script valida o dump criptografado, executa `pg_restore --list` e, quando autorizado, restaura no banco de teste.

A URL do projeto e a chave `anon` podem existir no frontend quando alguma tela usar Supabase diretamente. A chave `service_role` nunca deve ir para o frontend ou para o Vercel do frontend; ela fica somente no backend.

Para montar a `DATABASE_URL`, use a senha do banco em:

```text
Supabase > Project Settings > Database > Connection string
```

## Rodar localmente

### Backend

```bash
cd backend
npm install
npm run prisma:generate
npm run start:dev
```

A API sobe em `http://localhost:3001`.

### Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Acesse `http://localhost:3000/cadastro`.

## Deploy no Vercel

O frontend deve ser publicado no Vercel:

```bash
cd frontend
vercel deploy -y
```

Configure no Vercel a variavel:

```env
NEXT_PUBLIC_API_URL=https://url-do-backend
```

Enquanto o backend nao estiver hospedado, o cadastro publicado no Vercel carrega a tela, mas o envio so funciona apontando para uma API acessivel pela internet.

## Roadmap

1. Fase 1: finalizar area do candidato para editar curriculo e excluir conta.
2. Fase 2: exportacao de PDF a partir dos dados estruturados.
3. Fase 3: painel de empresas com login, 2FA e filtros diretos.
4. Fase 4: painel admin, aprovacao de empresas e logs LGPD.
5. Fase 5: ampliar observabilidade da regua de revalidacao e adicionar WhatsApp quando o provedor for definido.
6. Fase 6: alerta reverso por vaga/necessidade.
7. Fase 7: busca semantica com embeddings + pgvector e WhatsApp Business API.
8. Fase 8: hardening, backup, testes de carga, pentest basico e go-live.
