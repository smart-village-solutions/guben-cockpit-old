## 1. Cache Primitive

- [x] 1.1 Add a generic bounded in-memory fresh/stale cache with deterministic time injection, four-minute freshness, 24-hour stale eligibility, and configurable/default 500-entry capacity.
- [x] 1.2 Implement in-flight request coalescing and least-recently-used eviction without cancelling active loads.
- [x] 1.3 Add unit tests for fresh hits, successful refresh, stale-on-error, stale expiry, recovery, parallel loads, distinct keys, and LRU behavior.

## 2. GraphQL Client Integration

- [x] 2.1 Add deterministic validator-contract-ID, query, and canonical-variable key generation that excludes OAuth credentials, ignores object-property insertion order, and handles equivalent absent variables consistently.
- [x] 2.2 Add an explicit validated cached-read API to `SmartVillageGraphQLClient` while retaining the existing uncached request path.
- [x] 2.3 Ensure only responses accepted by the supplied validator are promoted and that transport, timeout, GraphQL, and validation failures preserve an eligible last-good response.
- [x] 2.4 Extend GraphQL client tests for successful caching, validation failures, retries before stale delivery, validator-contract isolation, canonical variable keys, and uncached requests.

## 3. SVA Repository Adoption

- [x] 3.1 Move Cockpit Card collection reads to the cached-read API with validation that preserves current category mapping, malformed-item skipping, and local fallback behavior.
- [x] 3.2 Move POI list and detail reads to the cached-read API with collection/detail validators that accept domain-valid absent detail results while retaining existing one-minute repository caches.
- [x] 3.3 Move booking FAQ collection reads to the cached-read API with validation that preserves valid empty collections and malformed-item skipping.
- [x] 3.4 Move Event list and detail reads to the cached-read API with collection/detail validators that accept domain-valid absent detail results while retaining existing one-minute repository caches and occurrence mapping.
- [x] 3.5 Move Featured Project list and detail reads to the cached-read API with validation for required collections, public mapping invariants, duplicate `externalId` rejection, and domain-valid absent detail results.
- [x] 3.6 Extend repository tests to prove fresh, stale, invalid-response, recovery, no-new-PostgREST-fallback behavior, and that successful upstream detail deletion replaces a previously cached value for every SVA detail family.

## 4. Runtime Wiring and Compatibility

- [x] 4.1 Configure one shared cache instance for the production Smart Village GraphQL client and keep the cache process-local with no new required deployment variables.
- [x] 4.2 Keep the Smart Village readiness probe on the uncached request path and test that repeated probes perform live GraphQL requests even when content is cached.
- [x] 4.3 Add gateway integration tests proving public routes and response contracts remain unchanged when fresh or stale SVA responses are served.
- [x] 4.4 Document the four-minute freshness, approximately five-minute effective visibility, 24-hour stale-on-error policy, per-process scope, cold-start behavior, and rollback procedure.

## 5. Validation

- [x] 5.1 Run all shared, content-gateway, frontend, and PostgREST test suites, including coverage where required by CI.
- [x] 5.2 Run repository typechecks, lint checks, and the production build.
- [x] 5.3 Run strict OpenSpec validation and inspect the completed change with `openspec show` before implementation handoff.
