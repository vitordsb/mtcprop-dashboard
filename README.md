# appDashInterno/App

Monolito do dashboard interno da MTCprop.

## Stack

- Next.js App Router
- Prisma
- Postgres
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

Ou manualmente dentro desta pasta:

```bash
cp .env.example .env
pnpm install
pnpm db:bootstrap
pnpm dev
```

Se o seu Postgres local ainda estiver com schema antigo criado por `db:push`, resete a base antes de migrar para esse fluxo.

## Scripts úteis

```bash
pnpm dev
pnpm build
pnpm start
pnpm typecheck
pnpm db:generate
pnpm db:push
pnpm db:migrate
pnpm db:migrate:deploy
pnpm db:seed
pnpm db:bootstrap
pnpm db:studio
```

## Produção

Deploy esperado na Vercel, usando `appDashInterno/App` como root directory e Postgres configurado nas variáveis `DATABASE_URL` e `DIRECT_URL`.

Passos:

1. Fazer o push para o GitHub.
2. Garantir que a Vercel esteja apontando para `appDashInterno/App`.
3. Configurar `DATABASE_URL` com a URL de pooling/prisma do banco.
4. Configurar `DIRECT_URL` com a URL non-pooling do banco.
5. Deixar a build usar `pnpm vercel-build`, que aplica `prisma migrate deploy` antes do build.
6. Se precisar subir dados iniciais, rodar `pnpm db:seed` a partir de uma maquina que tenha acesso ao repo e à planilha.
