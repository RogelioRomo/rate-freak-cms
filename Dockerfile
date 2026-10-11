# syntax=docker/dockerfile:1
# Requires `output: 'standalone'` in next.config.ts.
# Build with docker-compose.prod.yml — it provides the `env` secret and host networking.

FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app

# ---- Dependencies ------------------------------------------------------------
FROM base AS deps
RUN corepack enable && corepack prepare pnpm@10.28.2 --activate
COPY package.json pnpm-lock.yaml .npmrc ./
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

# ---- Build -------------------------------------------------------------------
FROM deps AS builder
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1

# `next build` prerenders catalog pages straight from Postgres, so it needs the
# production env (DATABASE_URL, PAYLOAD_SECRET, NEXT_PUBLIC_SERVER_URL, ...).
# It's mounted as a secret and removed in the same layer, so it never ends up in the image.
RUN --mount=type=secret,id=env,required=true \
    cp /run/secrets/env .env.production \
    && export NEXT_PUBLIC_SERVER_URL="$(sed -n 's/^NEXT_PUBLIC_SERVER_URL=//p' .env.production | tr -d '"\r')" \
    && pnpm run build; \
    status=$?; rm -f .env.production .next/standalone/.env*; exit $status

# ---- Migrations (one-off: `docker compose -f docker-compose.prod.yml run --rm migrate`)
FROM deps AS migrate
COPY . .
CMD ["pnpm", "payload", "migrate"]

# ---- Runtime -----------------------------------------------------------------
FROM base AS runner
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

RUN addgroup -S -g 1001 nodejs && adduser -S -u 1001 -G nodejs nextjs

COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
