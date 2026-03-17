# Guben Cockpit

Public content stack for `cockpit.guben.de`.

The repository now consists of:

- `frontend/`: React/TanStack public website
- `content-gateway/`: Node/TypeScript API for `/api/content/*`
- `postgrest/`: read-only PostgREST facade on top of PostgreSQL

The former `.NET` CMS/admin stack has been removed from this branch.

## Architecture

Runtime flow:

1. `frontend` fetches public content from `content-gateway`
2. `content-gateway` reads from `postgrest`
3. `postgrest` exposes the `public_content` schema from PostgreSQL

External services still used by the public frontend:

- Booking/Biletado
- LibreTranslate
- Masterportal
- Matomo

## Local Docker setup

Copy the local env template and fill in any overrides you need:

```bash
cp docker-compose.local.env.example docker-compose.local.env
```

Start the default public stack:

```bash
docker compose --env-file docker-compose.local.env up -d --build \
  postgrest-bootstrap \
  postgrest \
  content-gateway \
  web \
  web-live \
  adminer
```

Important:

- the default stack reuses an already running PostgreSQL instance on the host
- it does not reset the database
- avoid `docker compose down -v` unless you explicitly want to drop volumes

Local URLs:

- `http://127.0.0.1:3000/` prerendered public build
- `http://127.0.0.1:3300/` interactive Vite frontend
- `http://127.0.0.1:5100/health` gateway health
- `http://127.0.0.1:3001/` PostgREST
- `http://127.0.0.1:8080/` Adminer

## Local development without Docker

Gateway:

```bash
cd content-gateway
cp .env.example .env
npm install
npm run build
npm start
```

Frontend:

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

## Verification

Gateway:

```bash
cd content-gateway
npm run lint
npm test
npm run build
```

Frontend:

```bash
cd frontend
npm run verify:gateway-contracts
npm run build
```

## Deployment artifacts

GitHub Actions builds and publishes two images:

- `ghcr.io/smart-village-solutions/guben-cockpit-web`
- `ghcr.io/smart-village-solutions/guben-cockpit-content-gateway`

PostgREST uses the upstream `postgrest/postgrest` image plus the SQL/bootstrap files from this repository.

## Weitere Dokumentation

- [arc42-Architekturdokumentation](./docs/arc42.md)
- [Systemdokumentation](./docs/system-documentation.md)
- [Gateway-Rollout](./docs/public-content-gateway-rollout.md)
- [Deploy-Runbook](./docs/deploy-runbook.md)
