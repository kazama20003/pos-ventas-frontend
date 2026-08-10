FROM node:22-bookworm-slim AS base

WORKDIR /app

RUN npm install --global pnpm@11.20.0

FROM base AS dependencies

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

RUN pnpm install --frozen-lockfile

FROM dependencies AS build

ENV NEXT_PUBLIC_GOOGLE_CLIENT_ID=430901289351-ulmcqtg3hvmjsan0bni1jncofvnnich5.apps.googleusercontent.com

COPY . .

RUN pnpm build

FROM node:22-bookworm-slim AS production

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080
ENV HOSTNAME="0.0.0.0"

COPY --from=build --chown=node:node /app/public ./public
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static

USER node

EXPOSE 8080

CMD ["node", "server.js"]
