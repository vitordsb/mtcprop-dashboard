# appDashInterno/App

Monolito do dashboard interno da MTCprop.

## Stack

- Next.js App Router
- Prisma
- PostgreSQL via Prisma
- Tailwind CSS

## Dados

- O dashboard consome o Postgres via Prisma.
- O seed lê a planilha em `/docs/planilhaBase.xlsx` por padrao, ou em `WORKBOOK_PATH` quando definido.
- O runtime nao depende da planilha; os dados operacionais sao lidos do Postgres.

## Desenvolvimento local

Pela raiz do repositório:

```bash
docker compose up -d
```

Esse fluxo sobe apenas o dashboard e usa o `.env.local` do `App`, que pode apontar direto para o Supabase.

Ou manualmente dentro desta pasta:

```bash
cp .env.example .env
pnpm install
pnpm db:bootstrap
pnpm dev
```

Se ainda existir algum container antigo do fluxo local com Postgres, limpe primeiro com `docker compose down --remove-orphans`.

## Scripts úteis

```bash
pnpm dev
pnpm build
pnpm start
pnpm typecheck
pnpm db:check
pnpm db:generate
pnpm db:push
pnpm db:migrate
pnpm db:migrate:deploy
pnpm db:seed
pnpm db:bootstrap
pnpm db:supabase:env
pnpm db:supabase:bootstrap
pnpm db:studio
```

## Produção

Deploy esperado na Vercel, usando `appDashInterno/App` como root directory e Supabase Postgres configurado nas variáveis `DATABASE_URL` e `DIRECT_URL`.

Passos:

1. Fazer o push para o GitHub.
2. Garantir que a Vercel esteja apontando para `appDashInterno/App`.
3. Configurar `DATABASE_URL` com a URL do Supavisor Transaction Mode (porta `6543` + `pgbouncer=true`).
4. Configurar `DIRECT_URL` com a URL do Supavisor Session Mode (porta `5432`).
5. Configurar `APP_URL` com o domínio publicado na Vercel.
6. Configurar `AUTH_SECRET` com uma chave longa e exclusiva.
7. Configurar `GURU_ACCOUNT_TOKEN` e `GURU_USER_TOKEN` para liberar webhook e consumo da API pública da Guru.
8. Configurar `GURU_API_BASE_URL` apenas se a conta usar base diferente da padrão.
9. Deixar a build usar apenas `pnpm build`.
10. Se precisar preparar o banco remoto, rodar `pnpm db:migrate:deploy` manualmente a partir de uma maquina com acesso ao banco.
11. Se precisar subir dados iniciais, rodar `pnpm db:seed` a partir de uma maquina que tenha acesso ao repo e à planilha.

Importante:

- Na Vercel, o Prisma deve usar apenas as variaveis do dashboard.
- O projeto continua usando Prisma; a troca de Neon/Vercel Postgres para Supabase e puramente de infraestrutura/conexão.
- Para Vercel serverless, siga o padrão do Supabase: `postgresql://postgres.<project-ref>:<password>@aws-1-<region>.pooler.supabase.com:6543/postgres?pgbouncer=true` no `DATABASE_URL` e a mesma base com porta `5432` no `DIRECT_URL`.
- O projeto agora consegue derivar `DATABASE_URL` e `DIRECT_URL` automaticamente a partir de `SUPABASE_PROJECT_REF`, `SUPABASE_REGION`, `SUPABASE_DB_NAME`, `SUPABASE_DB_USER`, `SUPABASE_POOLER_CLUSTER` e `SUPABASE_DB_PASSWORD`.
- Para conferir as URLs finais antes de subir, rode `pnpm db:supabase:env`.
- Para validar se a aplicação realmente está falando com o banco online, rode `pnpm db:check`.
- Para bootstrap remoto do Supabase em uma passada, rode `pnpm db:supabase:bootstrap`.
- Nao suba `appDashInterno/App/.env` nem `appDashInterno/App/.env.local` para o repositório.
- Se esses arquivos ja foram enviados ao GitHub em algum momento, remova-os do repositório antes do novo deploy.
- O deploy de prototipo nao executa migrations automaticamente; o banco fica como passo operacional separado.

## Checklist rápido de release para a Vercel

- `pnpm typecheck`
- `pnpm lint`
- `pnpm build`
- confirmar login local
- confirmar `/dashboard/traders`
- confirmar `/dashboard/vendas`
- confirmar `/dashboard/planos-ativos`
- revisar se `APP_URL`, `AUTH_SECRET`, `DATABASE_URL`, `DIRECT_URL`, `GURU_ACCOUNT_TOKEN` e `GURU_USER_TOKEN` estão definidos na Vercel
