## Why

Every Cockpit request for Smart Village content can currently trigger a fresh GraphQL read, while the existing POI and event caches use separate policies and FAQ, Cockpit Cards, and Featured Projects are not cached consistently. A shared resilient read cache should reduce Mainserver load and latency while keeping the last successful Smart Village response available during temporary upstream failures.

## What Changes

- Add a central in-memory cache for all Smart Village GraphQL content reads, keyed by a stable validator-contract ID, query, and variables.
- Treat cached responses as fresh for four minutes and allow the last validated response to be served for up to 24 hours only when refresh fails.
- Coalesce concurrent identical reads and bound cached detail-query cardinality with least-recently-used eviction.
- Require each cached content query to validate its domain response before that response may replace the last successful value.
- Treat domain-valid absent detail results as successful responses so deletions replace previously cached content instead of being served as stale data.
- Bypass the cache for readiness probes so health reporting continues to reflect the live Mainserver.
- Keep public gateway contracts, UI behavior, PostgREST responsibilities, and existing repository caches unchanged in the first rollout.

## Capabilities

### New Capabilities

- `resilient-smart-village-read-cache`: Defines freshness, stale-on-error delivery, validation, request coalescing, bounded storage, and readiness bypass for Smart Village GraphQL reads.

### Modified Capabilities

None.

## Impact

- Affects the Smart Village GraphQL client and the Smart Village repositories for Cockpit Cards, POIs, FAQ, Events, and Featured Projects.
- Adds in-memory cache state inside each content-gateway process; no new external service or browser API is introduced.
- Does not change response schemas, routes, filters, presentation, OAuth handling, or PostgREST data access.
- Normal content changes become visible within approximately five minutes when the existing one-minute repository caches are included.
