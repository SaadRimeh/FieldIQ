FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci --only=production && \
    npx prisma generate

COPY . .
RUN npm run build

# ── Production Stage ──────────────────────────────────
FROM node:20-alpine AS production

WORKDIR /app

RUN addgroup -S fieldiq && adduser -S fieldiq -G fieldiq

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./

RUN mkdir -p uploads && chown -R fieldiq:fieldiq /app

USER fieldiq

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget -qO- http://localhost:3001/health || exit 1

CMD ["node", "dist/main.js"]
