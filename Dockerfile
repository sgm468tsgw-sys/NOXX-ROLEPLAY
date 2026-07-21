FROM node:22-slim

WORKDIR /app

# Pre-built bot bundle (committed to repo, no build step needed)
COPY artifacts/api-server/dist/ ./artifacts/api-server/dist/

# Logo used by the ticket panel
COPY attached_assets/ ./attached_assets/

# Guild config is written here at runtime
RUN mkdir -p artifacts/api-server/data

ENV NODE_ENV=production
ENV PORT=8080

CMD ["node", "--enable-source-maps", "artifacts/api-server/dist/index.mjs"]
