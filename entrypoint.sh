#!/bin/sh
set -e

echo "🔄 Running Prisma db push..."
npx prisma db push --skip-generate 2>&1 || echo "⚠️ db push skipped"

echo "🌱 Running database seed..."
node prisma/compiled/seed.js 2>&1 || echo "⚠️ seed skipped (already seeded or error)"

echo "✅ Starting server..."
exec node server.js
