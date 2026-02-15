# ──────────────────────────────────────────
# Development stage (used by docker-compose)
# ──────────────────────────────────────────
FROM node:20-alpine AS dev

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev"]

# ──────────────────────────────────────────
# Builder stage
# ──────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ENV NODE_ENV=production
RUN npm run build

# ──────────────────────────────────────────
# Production stage — serve static assets with nginx
# ──────────────────────────────────────────
FROM nginx:alpine AS production

ENV NODE_ENV=production

RUN rm -rf /usr/share/nginx/html/*

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q -O- http://localhost:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
