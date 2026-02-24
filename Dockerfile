FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --legacy-peer-deps

# Generate Prisma Client
COPY prisma ./prisma/
RUN npx prisma generate

# Build the application
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build

# Compile seed script to JS (so we don't need ts-node at runtime)
RUN npx tsc prisma/seed.ts --outDir prisma/compiled --esModuleInterop --module commonjs --skipLibCheck

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy public assets
COPY --from=builder /app/public ./public

# Copy standalone build
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy Prisma schema + client (needed for runtime and seed)
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Copy bcryptjs (needed for seed script)
COPY --from=builder /app/node_modules/bcryptjs ./node_modules/bcryptjs

# Copy Prisma CLI (needed for db push at startup)
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma

# Copy entrypoint script
COPY --from=builder /app/entrypoint.sh ./entrypoint.sh

USER nextjs

EXPOSE 3001
ENV PORT=3001
ENV HOSTNAME="0.0.0.0"

CMD ["sh", "entrypoint.sh"]
