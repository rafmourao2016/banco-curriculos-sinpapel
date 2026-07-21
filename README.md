# Banco de Currículos do SINPAPEL

MVP inicial: Fase 0 (fundação) + Fase 1 (cadastro do candidato) do roadmap.

## O que já está implementado

- **Backend (NestJS + Prisma + PostgreSQL/pgvector)**
  - Schema completo do banco (todas as entidades do ERD), com Fase 1 funcional.
  - `POST /candidatos` — cadastro público, apenas dados estruturados (nenhum campo de upload de arquivo existe no DTO, por design).
  - `POST /auth/candidato/login` — login com senha com hash Argon2id.
  - `GET /candidatos/me` — candidato autenticado vê apenas o próprio currículo.
  - `PATCH /candidatos/me/confirmar-disponibilidade` — usado pela futura automação de revalidação a cada 90 dias.
  - `DELETE /candidatos/me` — exclusão imediata, conforme LGPD.
- **Frontend (Next.js + Tailwind + react-hook-form + zod)**
  - Página `/cadastro`: formulário mobile-first, um único passo, com labels associados e mensagens de erro acessíveis (base para a auditoria WCAG da Fase 7).

## Como rodar localmente

### 1. Subir infraestrutura (Postgres com pgvector + Redis)
```bash
docker compose up -d
```

### 2. Backend
```bash
cd backend
cp .env.example .env
npm install
npm run prisma:migrate -- --name init
npm run prisma:generate
npm run start:dev
```
A API sobe em `http://localhost:3001`.

### 3. Frontend
```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```
Acesse `http://localhost:3000/cadastro`.

## Próximos passos (conforme roadmap)

1. **Fase 2** — endpoint de exportação de PDF do currículo (Puppeteer).
2. **Fase 3** — módulo de empresas: login + 2FA, busca com filtros, atualização de status de contratação.
3. **Fase 4** — painel do administrador (aprovação de empresas, exclusões LGPD assistidas, logs).
4. **Fase 5** — job agendado (BullMQ) para revalidação de 90 dias via WhatsApp/e-mail.
5. **Fase 6** — alerta reverso (matching de `VagaNecessidade` com novos candidatos/reativações).
6. **Fase 7** — busca semântica (microserviço de embeddings + pgvector), integração oficial com WhatsApp Business API, API para ATS das empresas.

## Observações de segurança já aplicadas

- Senhas com Argon2id (nunca texto plano).
- `ValidationPipe` global com `whitelist: true` — qualquer campo fora do DTO é rejeitado, reforçando que o cadastro só aceita dados estruturados.
- Termo de consentimento LGPD é obrigatório no momento do cadastro e fica registrado com IP e data.
- Exclusão de conta é imediata e em cascata (remove experiências, formações, termo, etc.).
