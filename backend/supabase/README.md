# Supabase

Ordem para executar no SQL Editor do Supabase:

1. `001_extensions.sql`
2. `002_schema.sql`
3. `003_security.sql`
4. `004_briefing_fields.sql`
5. `005_operations.sql`
6. `006_semantic_ats.sql`
7. `007_password_reset.sql`
8. `008_revalidation_flow.sql`
9. `009_company_status_filters.sql`

Depois, copie a connection string do Supabase para `DATABASE_URL` no backend.

Use a URL de pooler para ambientes hospedados e serverless. Exemplo:

```env
DATABASE_URL="postgresql://postgres.iqfnmlyogzznjybylhug:<database-password>@aws-0-us-west-2.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://postgres.iqfnmlyogzznjybylhug:<database-password>@aws-0-us-west-2.pooler.supabase.com:5432/postgres"
```

O frontend nunca deve receber a `DATABASE_URL`.
