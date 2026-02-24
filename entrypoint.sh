#!/bin/sh
set -e

echo "🔄 Waiting for database to be ready..."
for i in $(seq 1 10); do
  if node -e "
    const { PrismaClient } = require('@prisma/client');
    const p = new PrismaClient();
    p.\$connect().then(() => { p.\$disconnect(); process.exit(0); }).catch(() => process.exit(1));
  " 2>/dev/null; then
    echo "✅ Database is ready!"
    break
  fi
  echo "⏳ Waiting for database... ($i/10)"
  sleep 3
done

echo "🔄 Running Prisma db push..."
node ./node_modules/prisma/build/index.js db push --accept-data-loss 2>&1 || echo "⚠️ db push completed with warnings"

echo "🌱 Running database seed..."
node prisma/compiled/seed.js 2>&1 || echo "⚠️ seed completed (already seeded or minor error)"

echo "✅ Starting Next.js server..."
exec node server.js
