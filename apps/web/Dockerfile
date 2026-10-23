# Development only; build context must be the monorepo root.
FROM node:22.22.3-bookworm-slim

RUN npm install --global pnpm@11.7.0
WORKDIR /workspace
RUN chown node:node /workspace

COPY --chown=node:node package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY --chown=node:node apps/api/package.json ./apps/api/package.json
COPY --chown=node:node apps/web/package.json ./apps/web/package.json
USER node
RUN pnpm install --frozen-lockfile

COPY --chown=node:node apps/web/src ./apps/web/src
COPY --chown=node:node apps/web/index.html apps/web/vite.config.ts apps/web/tsconfig.json ./apps/web/

ENV NODE_ENV=development
EXPOSE 5173
# The local dev script deliberately binds loopback; containers need a separate host.
CMD ["pnpm", "--filter", "@lgpd/web", "exec", "vite", "--host", "0.0.0.0"]
