#!/bin/sh
set -e

# Persisted app_node_modules volume can lag behind package-lock.json
LOCK_HASH_FILE=/app/node_modules/.package-lock-hash
if command -v md5sum >/dev/null 2>&1; then
  CURRENT_HASH=$(md5sum package-lock.json | awk '{print $1}')
else
  CURRENT_HASH=$(md5 -q package-lock.json)
fi
STORED_HASH=$(cat "$LOCK_HASH_FILE" 2>/dev/null || echo "")
if [ "$CURRENT_HASH" != "$STORED_HASH" ]; then
  echo "package-lock.json changed — refreshing node_modules..."
  npm ci
  echo "$CURRENT_HASH" > "$LOCK_HASH_FILE"
fi

./docker/prisma-migrate.sh
exec npm run start:dev
