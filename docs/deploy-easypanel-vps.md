# Deploy do backend na VPS com Easypanel

Objetivo: manter o site em `https://sinpapel.vercel.app` e mover somente a API para a VPS.

## 1. Criar app no Easypanel

1. Acesse o Easypanel da VPS.
2. Clique em **Novo**.
3. Crie um app para o backend, por exemplo: `sinpapel-api`.
4. Escolha deploy por repositório Git.
5. Configure:
   - **Diretório / Root**: `backend`
   - **Dockerfile**: `Dockerfile`
   - **Porta interna**: `3001`

## 2. Variáveis de ambiente

Cadastre no app `sinpapel-api` as mesmas variáveis do backend que hoje estão na Vercel:

```env
DATABASE_URL=
DIRECT_URL=
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
JWT_SECRET=
JWT_EXPIRES_IN=7d
ADMIN_TOKEN=
APP_URL=https://sinpapel.vercel.app
API_PUBLIC_URL=https://api.seudominio.com
CORS_ORIGIN=https://sinpapel.vercel.app
PORT=3001
CANDIDATE_REGISTRATION_CONCURRENCY=5
RESEND_API_KEY=
EMAIL_FROM=
BACKUP_PASSPHRASE=
```

Notas:

- `DATABASE_URL` deve usar o pooler do Supabase.
- `DIRECT_URL` deve usar a conexão direta do Supabase.
- `RESEND_API_KEY` e `EMAIL_FROM` podem ficar vazios enquanto o envio real de e-mail não estiver contratado/configurado.
- `API_PUBLIC_URL` deve ser a URL pública final da API na VPS.

## 3. Domínio da API

O ideal é criar um subdomínio, por exemplo:

```text
api.sinpapel.com.br
```

No DNS do domínio, crie um registro `A` apontando para:

```text
82.29.58.124
```

Depois, no Easypanel, vincule esse domínio ao app `sinpapel-api` e ative SSL.

## 4. Teste da API

Depois do deploy, abra:

```text
https://api.seudominio.com/health
```

O retorno esperado é:

```json
{"status":"ok"}
```

## 5. Apontar o frontend para a VPS

No Vercel do frontend, altere:

```env
NEXT_PUBLIC_API_URL=https://api.seudominio.com
```

Depois faça novo deploy de produção do frontend.

## 6. Validar antes da apresentação

Teste estes fluxos:

1. Cadastro de candidato pelo QR Code.
2. Login do candidato.
3. Login de empresa.
4. Busca de candidatos pela empresa.
5. Marcar candidato como contratado.
6. Login admin.
7. Indicadores e exportação Excel.
