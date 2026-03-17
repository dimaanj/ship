# BUILDER - Stage 1
FROM node:22-alpine AS builder
WORKDIR /app
RUN apk update && apk add --no-cache libc6-compat
RUN npm install --global --no-update-notifier --no-fund turbo@2.5.4
COPY . .
RUN turbo prune --scope=web --docker

# INSTALLER - Stage 2
FROM node:22-alpine AS installer
WORKDIR /app
RUN apk update && apk add --no-cache libc6-compat

COPY --from=builder /app/out/json/ .
COPY --from=builder /app/out/package-lock.json ./package-lock.json
RUN npm ci

COPY --from=builder /app/out/full/ .
COPY --from=builder /app/out/full/turbo.json ./turbo.json

# DEVELOPMENT - Stage 3
FROM installer AS development
CMD ["npx", "turbo", "run", "dev", "--filter=web"]

# APP_BUILDER - Stage 4
FROM installer AS app_builder

ARG APP_ENV
ENV NEXT_PUBLIC_APP_ENV=$APP_ENV

RUN npx turbo run build --filter=web...

# RUNNER - Stage 5
FROM node:22-alpine AS runner
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
USER nextjs

COPY --from=app_builder /app/apps/web/next.config.mjs .
COPY --from=app_builder /app/apps/web/package.json .

COPY --from=app_builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=app_builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=app_builder --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public

EXPOSE 3002

ENV PORT=3002

CMD ["node", "apps/web/server.js"]
