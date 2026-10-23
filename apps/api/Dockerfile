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

COPY --chown=node:node apps/api/src ./apps/api/src
COPY --chown=node:node apps/api/tsconfig.json ./apps/api/tsconfig.json

ENV NODE_ENV=development
EXPOSE 3000
CMD ["pnpm", "--filter", "@lgpd/api", "exec", "node", "--import", "tsx", "--watch", "src/main.ts"]
