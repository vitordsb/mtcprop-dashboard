FROM node:22-bookworm-slim

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV NODE_ENV="production"
ENV HOSTNAME="0.0.0.0"
ENV PORT="3000"

RUN corepack enable

WORKDIR /workspace/appDashInterno/App

COPY appDashInterno/App/package.json appDashInterno/App/pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile

COPY appDashInterno/App ./
COPY docs /workspace/docs

RUN pnpm db:generate
RUN pnpm build

EXPOSE 3000

CMD ["pnpm", "start"]
