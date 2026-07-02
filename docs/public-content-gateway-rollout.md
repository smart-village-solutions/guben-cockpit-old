# Public Content Gateway Rollout

## Runtime variables

Frontend build:

- `VITE_CONTENT_GATEWAY_URL`
- `VITE_PUBLIC_CONTENT_SOURCE`

Content gateway runtime:

- `POSTGREST_URL`
- `POSTGREST_TIMEOUT_MS`
- `POSTGREST_SCHEMA`
- `PUBLIC_BASE_URL`

PostgREST runtime:

- `PGRST_DB_URI`
- `PGRST_DB_SCHEMAS`
- `PGRST_DB_ANON_ROLE`
- `PGRST_OPENAPI_MODE`
- `PGRST_DB_ROOT_SPEC`

## Monitoring and alerting

Scrape `content-gateway` at `/metrics`.

Create alerts for:

- `gateway_upstream_failures_total` increasing for `upstream="postgrest"` over 5 minutes
- p95 request latency derived from `gateway_request_duration_ms` above 750ms for 10 minutes
- `/health/ready` probe failures from the gateway or PostgREST service

Use the structured JSON logs from the gateway for request IDs and endpoint-level triage.

## Staged rollout

1. Apply the SQL in `postgrest/sql/` and verify `postgrest/checks/verify_permissions.sql`.
2. Deploy PostgREST with the `guben_public_content_reader` role and the `public_content` schema only.
3. Deploy `content-gateway` with `CONTENT_SOURCE_MODE=postgrest`.
4. Deploy the frontend against the gateway with `VITE_PUBLIC_CONTENT_SOURCE=gateway` and smoke-test `/api/content/*`, `/health/ready`, and `/metrics`.
5. Verify prerendered HTML for `/`, `/projects`, `/events`, `/map`.
6. Watch latency plus upstream failure counters for at least one release window.

## Docker Compose

Local Docker Compose now wires the stack as:

- the default stack reuses an already running PostgreSQL instance via `host.docker.internal`
- `postgrest-bootstrap` applies the role, schema, views, grants, and permission checks idempotently
- `postgrest` starts only after the bootstrap completed successfully
- `content-gateway` points at PostgREST inside the Docker network
- `web` waits for the gateway and then builds/prerenders before serving static files
- `web-live` starts the interactive public frontend through Vite for UI testing against the gateway

Start the stack:

```bash
docker compose up --build postgrest-bootstrap postgrest content-gateway web adminer
```

For interactive testing with the Vite frontend instead of the prerendered SEO output:

```bash
docker compose up --build postgrest-bootstrap postgrest content-gateway web-live adminer
```

`web-live` is browser-facing, so it should use host-reachable URLs such as `VITE_CONTENT_GATEWAY_BROWSER_URL=http://127.0.0.1:5100`.

Important:

- this does **not** start or replace your existing PostgreSQL container
- the bootstrap SQL is written to be idempotent
- avoid `docker compose down -v` unless you explicitly want to remove the database volume
- if you want a dedicated local PostgreSQL from this repo, start it explicitly with `--profile local-db` and point `PGRST_DB_URI` at `postgres:5432`
- all published host ports are overridable, for example `WEB_PORT=3300 CONTENT_GATEWAY_PORT=5200 docker compose up ...`

## Rollback

1. Redeploy the previously known-good frontend and gateway images.
2. Leave `content-gateway` and PostgREST running for diagnosis unless they are the incident source.
3. If the gateway itself is the issue, disable gateway-backed public content with `VITE_PUBLIC_CONTENT_SOURCE=disabled` or remove traffic from the service, and restore only after `/health/ready`, `/metrics`, and the contract checks are green again.
