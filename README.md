# Guben Cockpit

Public content stack for `cockpit.guben.de`.

The repository now consists of:

- `frontend/`: React/TanStack public website
- `content-gateway/`: Node/TypeScript API for `/api/content/*`
- `postgrest/`: read-only PostgREST facade on top of PostgreSQL for non-event public content

The former `.NET` CMS/admin stack has been removed from this branch.

## Architecture

Runtime flow:

1. `frontend` fetches public content from `content-gateway`
2. `content-gateway` combines PostgREST page/layout data with Smart Village GraphQL content
3. Smart Village supplies Events, POIs, Booking FAQs, Featured Projects, and dashboard cards (`COCKPIT_CARD`)
4. `postgrest` exposes the `public_content` schema from PostgreSQL for page metadata, layout, regular projects, map/footer data, booking tenants, and local dashboard-card fallbacks

Important public content endpoints:

- `GET /api/content/public`, `/home`, and `/dashboard`: PostgREST layout enriched with language-specific Smart Village dashboard cards; local cards remain the fallback
- `GET /api/content/events` and `/events/:id`: Smart Village Events
- `GET /api/content/pois` and `/pois/:id`: Smart Village Points of Interest
- `GET /api/content/featured-projects` and `/featured-projects/:id`: Smart Village Featured Projects with PostgREST page metadata for the collection
- `GET /api/content/booking/faqs`: language-specific Smart Village `FAQ` items
- `GET /api/content/projects`: regular PostgREST projects; in the public bundle schools and marketplace entries are found in `projects.items` with category `school` or `business`

External services still used by the public frontend:

- Smart Village
- Booking/Biletado
- LibreTranslate
- Masterportal
- Matomo

### Smart Village read cache

Smart Village GraphQL content reads use a process-local validated cache. Successful responses are fresh for four minutes; the existing one-minute POI and Event repository caches can therefore make normal upstream changes visible after approximately five minutes. If a refresh fails, the last domain-valid response may be served for up to 24 hours from its last successful validation. A successful absent detail response replaces older content and continues through the existing `NOT_FOUND` behavior.

Cache entries and in-flight requests are not shared between gateway processes and are empty after every restart or deployment. Readiness requests always bypass the content cache and continue to report the live Smart Village dependency. No deployment variable is required. Roll back by reverting the cached-read repository wiring or the release containing it; the process-local cache has no persistent state to clean up.

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
- local event cutover in `CONTENT_SOURCE_MODE=postgrest` also requires `SV_GRAPHQL_URL`, `SV_OAUTH_TOKEN_URL`, `SV_CLIENT_ID`, and `SV_CLIENT_SECRET` for the gateway

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

For local gateway runs in `CONTENT_SOURCE_MODE=postgrest`, configure these Smart Village credentials in `content-gateway/.env`:

- `SV_GRAPHQL_URL`
- `SV_OAUTH_TOKEN_URL`
- `SV_CLIENT_ID`
- `SV_CLIENT_SECRET`

Frontend:

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Builder.io Preview:

```bash
cd frontend
npm run dev
```

Dann in `frontend/.env` den Wert `VITE_BUILDER_PUBLIC_API_KEY` setzen und Builder als Preview-URL lokal auf `http://localhost:3000/builder-preview?url=/` konfigurieren.
Wenn Builder deinen lokalen Rechner erreichen soll, nutze dafuer einen Tunnel wie `ngrok` oder `cloudflared` und trage statt `localhost` die oeffentliche Tunnel-URL ein.

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

The deployed `content-gateway` image also needs `SV_GRAPHQL_URL`, `SV_OAUTH_TOKEN_URL`, `SV_CLIENT_ID`, and `SV_CLIENT_SECRET` whenever it runs in `CONTENT_SOURCE_MODE=postgrest`, because Events, POIs, Booking FAQs, Featured Projects, and dashboard cards are read from Smart Village.

## Weitere Dokumentation

- [arc42-Architekturdokumentation](./docs/arc42.md)
- [Systemdokumentation](./docs/system-documentation.md)
- [Gateway-Rollout](./docs/public-content-gateway-rollout.md)
- [Deploy-Runbook](./docs/deploy-runbook.md)
