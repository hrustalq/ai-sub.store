#!/bin/sh
set -e

./docker/prisma-migrate.sh
exec node dist/src/main
