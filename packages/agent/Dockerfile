# syntax=docker/dockerfile:1.7
# ─────────────────────────────────────────────────────────────────────
# @regista11/agent — production container for the 24/7 multi-persona runtime.
#
# Builds the monorepo with only the agent's dependency graph hoisted,
# then runs the compiled JS under Node 22 with PORT supplied by Railway.
# Health probe at GET /health (see cli-entry.ts).
# ─────────────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app

# pnpm + corepack
RUN corepack enable && corepack prepare pnpm@10.33.0 --activate

# Monorepo manifest first (better layer caching).
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/agent/package.json packages/agent/
COPY packages/contracts/package.json packages/contracts/

# Install only what the agent needs.
RUN pnpm install --frozen-lockfile --filter @regista11/agent...

# Source.
COPY packages/agent /app/packages/agent
# Compiled contract artifacts (ABIs the agent reads at runtime).
COPY packages/contracts/out /app/packages/contracts/out
# Optional deployment artifact — agent loads on startup if present.
COPY packages/contracts/deployments /app/packages/contracts/deployments

# Generate Prisma client + compile TS → dist.
RUN pnpm --filter @regista11/agent exec prisma generate \
    && pnpm --filter @regista11/agent build

# ─────────────────────────────────────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN corepack enable && corepack prepare pnpm@10.33.0 --activate

COPY --from=builder /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml ./
COPY --from=builder /app/packages/agent ./packages/agent
COPY --from=builder /app/packages/contracts/out ./packages/contracts/out
COPY --from=builder /app/packages/contracts/deployments ./packages/contracts/deployments
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/agent/node_modules ./packages/agent/node_modules

# Railway injects PORT; agent's /health binds to it (default 8080 locally).
EXPOSE 8080

# FIXTURE_ID is set as a Railway env var so we can flip matches without
# rebuilding the image. Falls back to a placeholder so the container at
# least logs a useful "missing fixture id" error if the var isn't set.
ENV FIXTURE_ID=0

CMD ["sh", "-c", "node packages/agent/dist/core/cli-entry.js \"$FIXTURE_ID\" --persona=all"]
