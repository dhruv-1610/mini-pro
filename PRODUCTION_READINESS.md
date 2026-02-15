# Production Readiness — CleanupCrew

This document describes the production readiness posture of the CleanupCrew platform: architecture, deployment, environment, backup, security, monitoring, and scaling.

---

## 1. System Overview

CleanupCrew is a mono-repo containing:

- **API** (`services/api`): Express + TypeScript REST API. Handles auth, drives, bookings, donations (Stripe), reports, map, expenses, transparency, leaderboard, and gamification.
- **Web** (`services/web`): React + TypeScript SPA (Vite). Uses protected routes, JWT refresh flow, and configurable API base URL.
- **MongoDB**: Primary data store for users, drives, attendance, donations, reports, expenses, and activity logs.

Production hardening includes: strict CORS, Helmet, rate limiting, webhook signature validation, Winston JSON logging, env validation at boot, multi-stage Docker builds, healthchecks, and CI (lint, test, coverage, audit).

---

## 2. Architecture (Text Diagram)

```
                    ┌─────────────────┐
                    │   Load Balancer │
                    │   (optional)    │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
              ▼              ▼              ▼
       ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
       │  Web (SPA)  │ │  Web (SPA)  │ │  API        │
       │  nginx:80   │ │  nginx:80   │ │  Node:4000  │
       └──────┬──────┘ └──────┬──────┘ └──────┬──────┘
              │               │               │
              │    VITE_API_URL (or proxy)    │
              └───────────────┼───────────────┘
                              │
                              ▼
                     ┌─────────────────┐
                     │  MongoDB         │
                     │  (replica set     │
                     │   optional)       │
                     └─────────────────┘
```

- **Web**: Static assets served by nginx (production Dockerfile). API base URL via `VITE_API_URL`.
- **API**: Single Node process; scale horizontally behind a load balancer. Connects to MongoDB via `MONGO_URI`.
- **MongoDB**: Single instance or replica set; backups via `scripts/mongo-backup.sh`.

---

## 3. Deployment Steps

### 3.1 Prerequisites

- Node.js 20+, or Docker & Docker Compose
- MongoDB 7+ (or use Docker)
- Stripe account (live keys for production)

### 3.2 Environment

1. Copy `.env.example` to `.env`.
2. Set all required variables (see **Environment Variables** below). App crashes at boot if any required env is missing or invalid.
3. For production: set `NODE_ENV=production`, strong `JWT_SECRET` / `JWT_REFRESH_SECRET`, live Stripe keys, and `ALLOWED_ORIGINS` to your frontend origin(s).

### 3.3 Docker (recommended for production)

- **Development**: `docker-compose up` — runs API (dev), Web (dev), MongoDB.
- **Production**: `docker-compose --profile prod up -d` — runs `api-prod`, `web-prod`, and MongoDB.
  - API: multi-stage build, `NODE_ENV=production`, no dev dependencies, healthcheck on `/health`.
  - Web: multi-stage build; nginx serves built SPA; healthcheck on `/`.

Build images:

```bash
docker-compose --profile prod build
docker-compose --profile prod up -d
```

Ensure `.env` is present and contains production values (never commit `.env`).

### 3.4 Non-Docker

- **API**: `cd services/api && npm ci --omit=dev && npm run build && NODE_ENV=production node dist/server.js`
- **Web**: `cd services/web && npm ci && npm run build`; serve `dist/` with nginx or any static server. Set `VITE_API_URL` at build time to the public API URL.
- **MongoDB**: Run externally; set `MONGO_URI` accordingly.

---

## 4. Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NODE_ENV` | No | `development` \| `production` \| `test`. Default: `development`. |
| `PORT` | No | API port. Default: `4000`. |
| `API_HOST` | No | Bind address. Default: `0.0.0.0`. |
| `MONGO_URI` | **Yes** | MongoDB connection string (`mongodb://` or `mongodb+srv://`). |
| `JWT_SECRET` | **Yes** | Access token secret (min 8 chars). |
| `JWT_EXPIRES_IN` | No | Access token TTL. Default: `15m`. |
| `JWT_REFRESH_SECRET` | **Yes** | Refresh token secret (min 8 chars). |
| `JWT_REFRESH_EXPIRES_IN` | No | Default: `7d`. |
| `STRIPE_SECRET_KEY` | **Yes** | Stripe secret key. |
| `STRIPE_WEBHOOK_SECRET` | **Yes** | Stripe webhook signing secret. |
| `ALLOWED_ORIGINS` | **Yes** | Comma-separated CORS origins. |
| `RATE_LIMIT_WINDOW_MS` | No | Rate limit window. Default: 900000. |
| `RATE_LIMIT_MAX` | No | Max requests per window. Default: 100. |
| `UPLOAD_DIR` | No | File upload directory. Default: `./uploads`. |
| `MAX_FILE_SIZE` | No | Max body size (bytes). Default: 5242880. |
| `LOG_LEVEL` | No | `error` \| `warn` \| `info` \| `debug`. Default: `info`. |

**Frontend (build-time):**

- `VITE_API_URL`: API base URL for the SPA (e.g. `https://api.example.com`).
- `VITE_STRIPE_PUBLISHABLE_KEY`: Stripe publishable key for donations.

See `.env.example` for a full template.

---

## 5. Backup Strategy

- **Script**: `scripts/mongo-backup.sh` uses `mongodump` and `MONGO_URI`. Requires [MongoDB Database Tools](https://www.mongodb.com/docs/database-tools/installation/installation/) installed.
- **Usage**: `./scripts/mongo-backup.sh [output_dir]`. Default output: `./backups/<timestamp>`.
- **Restore**: Use `mongorestore --uri="$MONGO_URI" --drop <backup_path>` (use with care; `--drop` drops existing collections).
- **Example cron** (daily at 2 AM):  
  `0 2 * * * cd /path/to/MiniProj && . ./.env 2>/dev/null; ./scripts/mongo-backup.sh /backups/cleanupcrew`

Ensure `MONGO_URI` is set (e.g. from `.env`) when running the script. Retain backups off-host and test restores periodically.

---

## 6. Security Checklist

- **CORS**: Strict; only `ALLOWED_ORIGINS` accepted. Credentials allowed.
- **Helmet**: Active (CSP, CORP, Referrer-Policy, Frameguard). Stripe domains allowed where needed.
- **Rate limiting**: Global limit via `express-rate-limit`; stricter limits on auth/donate/reports routes.
- **Webhook**: Stripe webhook signature validated; invalid signature rejected.
- **Secrets**: No secrets in repo; `.env` in `.gitignore`. JWT and Stripe keys redacted in logs (sanitized in error handler).
- **Mongo**: Input sanitized (express-mongo-sanitize) to prevent `$`/`.` injection.
- **Auth**: JWT access + refresh; password hashing with bcrypt.

---

## 7. Monitoring Recommendations

- **Health**: GET `/health` returns `{ "ok": true }`. Use for load balancer and container healthchecks.
- **Logs**: Production API uses Winston JSON logs with `requestId`, `method`, `path`, `statusCode`, `responseTime`. Error logs sanitized (no stack in prod). Ingest into a log aggregator (e.g. ELK, Datadog, CloudWatch).
- **Metrics**: Add application metrics (e.g. request duration, error rate) via your preferred exporter (Prometheus, etc.) if needed.
- **Alerts**: Alert on API 5xx rate, MongoDB connectivity, and disk/memory for the API and DB hosts.

---

## 8. Scaling Strategy

- **API**: Stateless; run multiple instances behind a load balancer. Share `JWT_SECRET`/`JWT_REFRESH_SECRET` and Stripe config across instances.
- **Web**: Static files; scale nginx (or CDN) horizontally.
- **MongoDB**: Single instance sufficient for moderate load; for high availability use a replica set and connect with `mongodb+srv://` and appropriate read preference.
- **Rate limits**: Tuned per-instance; if running N API instances, total capacity is N × RATE_LIMIT_MAX per window. Adjust or use a shared store (e.g. Redis) for global limiting if required.

---

## 9. Performance & Indexes

MongoDB indexes are defined on schemas and ensured at runtime via `npm run db:ensure-indexes` (or deploy-time migration):

- **Location**: `Report`, `Drive` — `2dsphere` for geo queries.
- **Status**: `Report`, `Drive` (and compound where used).
- **driveId**: `Attendance` (compound with userId, role), `Expense`, `Donation`.
- **userId**: `Attendance`, `Donation`, `User` (role, organizerApproved), `ActivityLog` (performedBy + timestamp).

No synchronous blocking in request path; DB and Stripe calls are async. Run `db:ensure-indexes` after schema changes.

---

## 10. Known Limitations

- Rate limiting is in-memory; not shared across API instances.
- Refresh tokens are stored client-side (localStorage); consider httpOnly cookies for higher security when API supports it.
- Backup script assumes `mongodump` on PATH; not included in API container.
- CI runs on push/PR to `main`/`master`; coverage threshold 80% enforced for in-scope source files.

---

## 11. Future Improvements

- Redis (or similar) for shared rate limiting and session/refresh token revocation.
- Structured APM (e.g. OpenTelemetry) for tracing.
- Optional httpOnly cookie for refresh token.
- Run `mongodump` from a sidecar or scheduled job in Kubernetes for backup automation.
- Coverage badge from CI artifact or third-party (e.g. Codecov) in README.
