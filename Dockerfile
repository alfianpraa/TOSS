# syntax=docker/dockerfile:1

# ---- deps: install dependencies once, cached as long as the lockfile is unchanged ----
FROM node:22-alpine AS deps
WORKDIR /app
# Needed for Prisma's query engine and sharp (next/image) on Alpine/musl.
RUN apk add --no-cache libc6-compat
COPY package.json package-lock.json ./
RUN npm ci

# ---- builder: generate the Prisma client and produce the Next.js build ----
FROM node:22-alpine AS builder
WORKDIR /app
RUN apk add --no-cache libc6-compat
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Placeholders so any accidental build-time env read doesn't crash the build.
# The real values are supplied at runtime via docker-compose's env_file.
ENV DATABASE_URL="postgresql://user:pass@localhost:5432/db"
ENV AUTH_SECRET="build-time-placeholder"
RUN npx prisma generate
RUN npm run build

# ---- runner: the small, production-only image that actually gets deployed ----
FROM node:22-alpine AS runner
WORKDIR /app
RUN apk add --no-cache libc6-compat
ENV NODE_ENV=production

# `output: "standalone"` only copies what's traced; public/ and .next/static
# are intentionally excluded and have to be copied in manually.
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# pm2-runtime keeps the process alive, restarts it on crash, and gives
# `docker compose logs` / `pm2 logs` readable output.
RUN npm install -g pm2

RUN mkdir -p ./public/uploads/cards ./public/uploads/avatars

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

CMD ["pm2-runtime", "server.js"]
