#!/bin/sh
set -e

mkdir -p /app/data

echo "Applying database migrations..."
npx prisma migrate deploy

echo "Regenerating Prisma Client..."
npx prisma generate
