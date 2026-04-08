# =============================================================================
# Stage 1 — builder
# Instala todas as dependências (incluindo devDeps para build e seed),
# gera o cliente Prisma e compila o Next.js em modo standalone.
# =============================================================================
FROM node:22-bookworm-slim AS builder

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

RUN corepack enable

WORKDIR /workspace/appDashInterno/App

# Cache da instalação de dependências
COPY appDashInterno/App/package.json appDashInterno/App/pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Código-fonte e planilha de dados
COPY appDashInterno/App ./
COPY docs /workspace/docs

# Gera o Prisma Client e faz o build de produção
RUN pnpm db:generate
RUN pnpm build

# =============================================================================
# Stage 2 — runner
# Imagem mínima de produção: apenas o output standalone do Next.js.
# =============================================================================
FROM node:22-bookworm-slim AS runner

ENV NODE_ENV="production"
ENV HOSTNAME="0.0.0.0"
ENV PORT="3000"

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copia o output standalone (inclui server.js + node_modules mínimos)
COPY --from=builder /workspace/appDashInterno/App/.next/standalone ./
COPY --from=builder /workspace/appDashInterno/App/.next/static ./.next/static
COPY --from=builder /workspace/appDashInterno/App/public ./public

EXPOSE 3000

CMD ["node", "server.js"]
