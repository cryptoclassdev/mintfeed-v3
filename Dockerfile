FROM node:20-slim

# Prisma needs openssl
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /app

# Copy workspace config and lockfile first (better layer caching)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json tsconfig.base.json ./

# Copy only package.json files for dependency install
COPY apps/api/package.json ./apps/api/
COPY packages/db/package.json ./packages/db/
COPY packages/shared/package.json ./packages/shared/

# Copy patches (referenced by pnpm-lock.yaml)
COPY patches/ ./patches/

# Copy Prisma schema (needed for generate during install)
COPY packages/db/prisma ./packages/db/prisma/

RUN pnpm install --frozen-lockfile

# Copy source code
COPY apps/api/ ./apps/api/
COPY packages/db/src/ ./packages/db/src/
COPY packages/shared/ ./packages/shared/

# Generate Prisma client
RUN pnpm --filter @mintfeed/db db:generate

# Build the API
RUN pnpm --filter @mintfeed/api build

ENV NODE_ENV=production
EXPOSE 3000

WORKDIR /app/apps/api
CMD ["node", "dist/index.mjs"]
