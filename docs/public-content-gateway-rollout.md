# Public Content Gateway Rollout

Reviewed: 12 November 2026 against the repository configuration. This document covers initial setup and integration checks. For routine production updates use the [deploy runbook](deploy-runbook.md); for tags and publication use the [release procedure](releases.md).

## Runtime variables

Frontend build:

- `VITE_CONTENT_GATEWAY_URL`
- `VITE_PUBLIC_CONTENT_SOURCE`

Content gateway runtime:

- `POSTGREST_URL`
- `POSTGREST_TIMEOUT_MS`
- `POSTGREST_SCHEMA`
- `PUBLIC_BASE_URL`
- `CONTENT_SOURCE_MODE=postgrest`
- `SV_GRAPHQL_URL`, `SV_OAUTH_TOKEN_URL`, `SV_CLIENT_ID`, `SV_CLIENT_SECRET` (required together in `postgrest` mode)
- `TRANSLATE_URL`, `TRANSLATE_API_KEY`, `TRANSLATE_TIMEOUT_MS`, `TRANSLATE_CACHE_DIR` (optional server-side translation)

PostgREST runtime:

- `PGRST_DB_URI`
- `PGRST_DB_SCHEMAS`
- `PGRST_DB_ANON_ROLE`
- `PGRST_OPENAPI_MODE`
- `PGRST_DB_ROOT_SPEC`

## Monitoring and alerting

Scrape `content-gateway` at `/metrics`.

Create alerts for:

- `gateway_upstream_failures_total` increasing for `upstream="postgrest"` or `upstream="smartvillage"` over 5 minutes
- p95 request latency derived from `gateway_request_duration_ms` above 750ms for 10 minutes
- `/health/ready` probe failures from the gateway or PostgREST service

Use the structured JSON logs from the gateway for request IDs and endpoint-level triage.

## Staged rollout

1. Ensure the existing application schema and data are present: the bootstrap creates read views, not the source tables or content. Back up the database before initial provisioning. Apply the SQL in `postgrest/sql/` and verify `postgrest/checks/verify_permissions.sql`.
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
- `web` waits for gateway `/health` and then builds/prerenders before serving through the Node HTTP server; readiness must be checked separately
- `web-live` starts the interactive public frontend through Vite for UI testing against the gateway

Copy `docker-compose.local.env.example` to `docker-compose.local.env`, configure the existing database URI and SVA Mainserver credentials, then start the stack:

```bash
docker compose --env-file docker-compose.local.env up --build postgrest-bootstrap postgrest content-gateway web adminer
```

For interactive testing with the Vite frontend instead of the prerendered SEO output:

```bash
docker compose --env-file docker-compose.local.env up --build postgrest-bootstrap postgrest content-gateway web-live adminer
```

`web-live` is browser-facing, so it should use host-reachable URLs such as `VITE_CONTENT_GATEWAY_BROWSER_URL=http://127.0.0.1:5100`.

Important:

- this does **not** start or replace your existing PostgreSQL container
- the bootstrap SQL is written to be idempotent
- avoid `docker compose down -v` unless you explicitly want to remove the database volume
- if you want a dedicated local PostgreSQL from this repo, start it explicitly with `--profile local-db` and point `PGRST_DB_URI` at `postgres:5432`; this empty database still needs the application schema and data before the view bootstrap can succeed
- all published host ports are overridable, for example `WEB_PORT=3300 CONTENT_GATEWAY_PORT=5200 docker compose up ...`

## Rollback

1. Redeploy the previously known-good frontend and gateway images.
2. Leave `content-gateway` and PostgREST running for diagnosis unless they are the incident source.
3. If the gateway itself is the issue, rebuild the frontend with `VITE_PUBLIC_CONTENT_SOURCE=disabled` or remove traffic from the service, and restore only after `/health/ready`, `/metrics`, and the contract checks are green again.

The production stack does not run SQL bootstrap automatically. Do not repeat initial provisioning during a regular image update. Production container logs are read with `journalctl --namespace=guben-cockpit`; see the deploy runbook for retention and host setup.

## SVA Mainserver Cockpit Card verification

After deploying a gateway version that loads `COCKPIT_CARD` Generic Items:

1. Request `/api/content/dashboard?lang=de`, `?lang=en`, and `?lang=pl`.
2. Confirm that the local dropdown and tab structure is unchanged.
3. Confirm that card counts and titles match the language-specific Mainserver items for every known `categories.name` value.
4. Confirm ascending `payload.sortWeight` order within every tab and exercise one internal and one new-tab link.
5. Confirm that missing descriptions, images, and web URLs render without breaking the remaining cards.
6. Watch gateway logs for malformed items, unknown categories, and local-backup activation.
7. Test backup behavior in a controlled environment by making the SVA Mainserver card request unavailable and confirming that the local PostgREST cards remain visible.

New cards in an existing category require no local data change. A new category remains hidden until the local dashboard structure contains a localized tab title matching `categories.name` after trimming surrounding whitespace and ignoring case.
