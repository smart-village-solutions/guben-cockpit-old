# Event detail HTTP status

Direct requests to expired event URLs previously returned the homepage fallback
with HTTP 200 even though `/api/content/events/:id` returned 404. The same issue
affected prerendered HTML files when their event was removed after the build.

For GET and HEAD on `/events/:id`, including a trailing slash, the production
frontend now checks the event detail API before resolving any static file:

- API 200: serve the existing frontend page with HTTP 200.
- API 404: return a standalone HTML 404 page explaining that the event is no
  longer available, with a link to `/events`.
- Other statuses, connection failures, or the ten-second check timeout: return
  HTML 503 with a temporary-unavailability message and `Retry-After: 60`.

The error pages use `noindex` in both HTML and `X-Robots-Tag` and are not cached.
Event HTML responses are not cached by the frontend. The event list, assets, and
existing gateway/booking proxies retain their existing behavior. The check uses
the gateway's existing event rules and cache; it does not introduce a separate
event expiration rule or a new cache.

## Validation

`npm run test:server --prefix frontend` exercises the actual Node HTTP server and
a local mock gateway, including existing stale prerendered files, GET/HEAD,
unknown IDs, encoded IDs, language, upstream failures/timeouts, and an event
removed between two requests. CI runs these tests on Node 22.

## Scoped production rollout

The normal frontend Dockerfile includes this server correction on future builds.
`frontend/docker/Dockerfile.event-http-status` applies only the server file to
the immutable currently deployed frontend base for this scoped rollout:

```sh
docker buildx build --platform linux/amd64 \
  -f frontend/docker/Dockerfile.event-http-status \
  --build-arg CHANGE_REVISION="$(git rev-parse HEAD)" \
  -t ghcr.io/smart-village-solutions/guben-cockpit-web:v0.8.49-event-http-status.1 \
  --load .
```

Set the optional Portainer variable
`VERSION_FRONTEND=v0.8.49-event-http-status.1`. The original `VERSION_WEB` still
controls the content gateway; without this override it also controls the frontend.
Recreate only `guben-web-prod`, retaining all other stack configuration and the
already deployed importer removal. On a future normal release, remove the
override or update it together with the intended frontend version.

Before and after rollout, verify a known expired event with both GET and HEAD,
a currently listed event, the event list, POIs, featured projects, and the root
page. Compare the active image digest and the four other Cockpit container IDs.
Rollback restores the privately saved stack source/environment and web image.
