# CertGate local container. The build fetches npm dependencies; the running service needs no network in
# mock mode (it reads only files baked into the image). A live reading calls MODEL_BASE_URL when configured.
FROM node:24.21.0-bookworm-slim@sha256:d6aa754f16b3197301076f047b5def2f02ea1dbbc2ca920407d46d7ec7f87b20 AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY tsconfig.json vitest.config.ts ./
COPY src ./src
RUN npx tsc -p tsconfig.json

FROM node:24.21.0-bookworm-slim@sha256:d6aa754f16b3197301076f047b5def2f02ea1dbbc2ca920407d46d7ec7f87b20
ENV NODE_ENV=production \
    CERTGATE_MODE=mock \
    PORT=3000
WORKDIR /app
COPY package.json package-lock.json ./
# Dev dependencies stay in the image so the full test suite can run inside it with --network none.
RUN npm ci --include=dev --no-audit --no-fund && npm cache clean --force
COPY --from=build /app/dist ./dist
COPY tsconfig.json vitest.config.ts .env.example .gitignore README.md LICENSE ./
COPY src ./src
COPY test ./test
COPY config ./config
COPY data ./data
COPY docs ./docs
COPY tools ./tools
COPY evaluation ./evaluation
COPY public ./public
COPY api ./api
COPY vercel.json ./
# vitest writes a transient config bundle and a cache under /app when the suite runs inside the image.
RUN chown -R node:node /app
USER node
EXPOSE 3000
CMD ["node", "dist/src/server.js"]
