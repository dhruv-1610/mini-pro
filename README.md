# CleanupCrew

Production-grade mono-repo for the CleanupCrew platform.

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

## Environment Variables

See [`.env.example`](.env.example) for all required variables.

## CI/CD

GitHub Actions runs on every push and PR to `main`:
- Lint (api + web)
- Test (api)
- Build (api + web)
