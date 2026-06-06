# Production image
FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
COPY prisma ./prisma

RUN npm ci
RUN npx prisma generate

COPY . .
RUN npm run build

FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

RUN apk add --no-cache wget

COPY package.json package-lock.json ./
COPY prisma ./prisma

RUN npm ci --omit=dev && npm install prisma --no-save
RUN npx prisma generate

COPY --from=builder /app/dist ./dist
COPY docker/entrypoint.sh ./entrypoint.sh
COPY docker/prisma-migrate.sh ./docker/prisma-migrate.sh
RUN chmod +x ./entrypoint.sh ./docker/prisma-migrate.sh

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD wget -qO- http://localhost:3000/health/ready || exit 1

ENTRYPOINT ["./entrypoint.sh"]
