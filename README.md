# CleanupCrew

[![CI](https://github.com/CleanUpCrew/MiniProj/actions/workflows/ci.yml/badge.svg)](https://github.com/CleanUpCrew/MiniProj/actions/workflows/ci.yml)

Production-grade mono-repo for the CleanupCrew platform. CI runs lint, tests, coverage (≥80%), and `npm audit` (fails on high vulnerabilities).

## Architecture

```
cleanupcrew/
├── services/
│   ├── api/          # Express + TypeScript REST API
│   └── web/          # React + TypeScript SPA
├── docker-compose.yml
├── .env.example
└── .github/workflows/ci.yml
```

## Prerequisites

- Node.js 20+
- Docker & Docker Compose
- MongoDB 7+ (or use Docker)

## Quick Start

```bash
# 1. Clone and copy environment variables
cp .env.example .env

# 2. Start all services (api, web, mongo)
docker-compose up

# 3. Verify
curl http://localhost:4000/health
# → { "ok": true }
```

## Development (without Docker)

```bash
# API
cd services/api
npm install
npm run dev

# Web
cd services/web
npm install
npm run dev
```

## Testing

```bash
# API tests (requires MongoDB running on localhost:27017)
cd services/api
npm test
```

## Linting

```bash
cd services/api && npm run lint
cd services/web && npm run lint
```

## Security audit

The API uses `npm audit` to check for known vulnerabilities:

```bash
cd services/api
npm run audit          # report only
npm run audit:ci      # exit with non-zero on high or critical (used in CI)
```

CI fails if high or critical vulnerabilities are reported. Fix or suppress findings before merging.

## Environment Variables

See [`.env.example`](.env.example) for all required variables.

## Backup & Restore

MongoDB backup script: `scripts/mongo-backup.sh`. Requires `MONGO_URI` in environment and [MongoDB Database Tools](https://www.mongodb.com/docs/database-tools/) (`mongodump`). Restore with `mongorestore`. See [PRODUCTION_READINESS.md](PRODUCTION_READINESS.md) for backup strategy, example cron, and restore steps.

## CI/CD

GitHub Actions runs on every push and PR to `main`:
- Lint (api + web)
- Test (api)
- Audit (api; fails on high/critical vulnerabilities)
- Build (api + web)
