# ──────────────────────────────────────────
# Development stage
# ──────────────────────────────────────────
FROM node:20-alpine AS dev

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
EXPOSE 4000
CMD ["npm", "run", "dev"]

# ──────────────────────────────────────────
# Builder stage
# ──────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ──────────────────────────────────────────
# Production stage
# ──────────────────────────────────────────
FROM node:20-alpine

ENV NODE_ENV=production

WORKDIR /app
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist
RUN chown -R appuser:appgroup /app

USER appuser
EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:4000/health',r=>{r.on('data',()=>{});r.on('end',()=>process.exit(r.statusCode===200?0:1))}).on('error',()=>process.exit(1))"

CMD ["node", "dist/server.js"]
