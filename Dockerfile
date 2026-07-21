## ── Builder ─────────────────────────────────────────────────────────
FROM node:22-slim AS builder

RUN npm install -g pnpm@9

WORKDIR /app

# Workspace manifests
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml tsconfig.json tsconfig.base.json ./

# Shared lib packages the api-server depends on
COPY lib/api-zod/ ./lib/api-zod/
COPY lib/db/     ./lib/db/

# The bot artifact
COPY artifacts/api-server/ ./artifacts/api-server/

RUN pnpm install --frozen-lockfile

# esbuild bundles everything into a single dist/index.mjs
RUN pnpm --filter @workspace/api-server run build

## ── Runtime ─────────────────────────────────────────────────────────
FROM node:22-slim

WORKDIR /app

# Bundled bot (includes pino worker files)
COPY --from=builder /app/artifacts/api-server/dist/ ./artifacts/api-server/dist/

# Logo used by the ticket panel
COPY attached_assets/ ./attached_assets/

# Guild config is written here at runtime; the dir must exist
RUN mkdir -p artifacts/api-server/data

ENV NODE_ENV=production
ENV PORT=8080

CMD ["node", "--enable-source-maps", "artifacts/api-server/dist/index.mjs"]
