## Context

The content gateway reads Cockpit Cards, POIs, booking FAQ, Events, and Featured Projects from the SVA Mainserver through one OAuth-backed GraphQL client. OAuth tokens and concurrent token refreshes are already cached, but content caching is inconsistent: POI and Event repositories keep one-minute in-memory caches while the other SVA repositories issue a GraphQL request for every gateway read. A temporary Mainserver failure therefore has different visible effects depending on content type.

Normal content changes may take approximately three to five minutes to appear. During an outage, serving the last successful SVA response is acceptable for up to 24 hours. Public response contracts, existing UI error handling, and the intentional local Cockpit Card fallback must remain unchanged.

## Goals / Non-Goals

**Goals:**

- Reduce repeated identical GraphQL reads across every SVA-backed content type.
- Apply one freshness and stale-on-error policy at the shared GraphQL boundary.
- Preserve the last domain-valid SVA response across transient transport, GraphQL, and payload failures.
- Prevent duplicate concurrent loads and unbounded growth from detail-query IDs.
- Keep live readiness checks independent from cached content.

**Non-Goals:**

- Changing gateway routes, shared response contracts, filters, sorting, or presentation.
- Adding Redis or sharing cache entries between gateway processes.
- Moving filtering or pagination into GraphQL or reducing selected query fields.
- Removing the existing one-minute POI and Event repository caches in this first rollout.
- Adding a new local content fallback or changing the existing Cockpit Card fallback policy.
- Adding cache metrics in this minimal change.

## Decisions

### Cache validated GraphQL reads at the shared client boundary

The GraphQL client will expose an explicit opt-in cached-read path. Every cached read will provide a stable validator-contract ID in addition to its validator. Its cache key will be derived deterministically from that contract ID, the query document, and canonically serialized variables and will never contain the OAuth token. Object-key order and equivalent absent variables will not create different keys. Mutations and readiness probes will continue to use the uncached request path.

Centralizing here covers all five SVA content families with one implementation and allows identical requests from different callers to share an in-flight load. A gateway-response cache was rejected because it would cache every filter combination, mix PostgREST metadata with SVA content, and sit outside domain validation. Per-repository implementations were rejected for the first rollout because they would duplicate policy and leave behavior inconsistent.

### Require query-specific validation before promotion

Every cached content query will supply a validator that checks the collection or detail contract required by its repository. The client promotes a response only after this validator succeeds. Validation includes collection presence and query-specific identity or uniqueness invariants where those invariants currently fail the request. Valid empty collections remain cacheable.

This keeps malformed collections and duplicate identities from replacing a known-good entry. Individual malformed records that an existing repository intentionally skips do not invalidate an otherwise valid collection.

An absent detail result that is valid for its GraphQL contract, such as `null` or an empty result collection, is also a successful response. It replaces any previously cached detail value and then flows into the repository's existing `NOT_FOUND` handling. Stale-on-error applies only when the refresh itself fails transport, GraphQL, or validation; it must not resurrect content after a successful upstream deletion.

The validator-contract ID prevents callers with different domain contracts from sharing a cached value merely because their query text and variables happen to match. Reusing an ID therefore means reusing the same validation contract.

### Use a four-minute fresh window and a 24-hour stale window

An entry is fresh for four minutes from its last successful validation. Fresh reads return immediately. Once fresh time expires, the first caller performs a normal GraphQL request, including the existing retry policy, while concurrent identical callers await that same load.

If the refresh succeeds, it replaces the entry and resets both windows. If the final refresh attempt fails because of transport, timeout, GraphQL, or validator error, the client returns the last successful response while it is no more than 24 hours old. After 24 hours, or when no successful value exists, the error propagates to the existing repository and UI behavior.

The existing one-minute POI and Event caches remain for this rollout, yielding an effective normal visibility bound of approximately five minutes. They can be removed in a later simplification after production observation.

### Bound storage with least-recently-used eviction

The process-local cache will have a default maximum of 500 entries. Reading or successfully refreshing an entry marks it as recently used. Adding an entry over the limit evicts the least recently used entry. In-flight requests are tracked separately and are not cancelled by cache eviction.

The bound primarily protects against arbitrary detail IDs. Collection queries occupy a small, fixed number of keys. The limit will be an internal option for deterministic tests and future tuning, not a new required deployment variable.

### Preserve current caller-specific fallback behavior

The cache stores only SVA responses and never reads PostgREST. If no usable cached response exists, the GraphQL error is propagated exactly as today. Consequently POIs, FAQ, Events, and Featured Projects retain their visible error behavior, while Cockpit Cards may still use their already established local PostgREST fallback in the dashboard enrichment layer.

### Keep readiness live

The readiness probe will use the uncached GraphQL request method. Cached content can therefore keep pages useful during an outage without incorrectly reporting the Mainserver as ready.

## Risks / Trade-offs

- [Each gateway process has an independent cache and cold start] → Keep the implementation dependency-free and document Redis or another shared cache as a future scaling option.
- [Existing repository caches add up to about one minute of extra age] → Use a four-minute central fresh window and retain tests for the approximately five-minute upper bound; remove layered caches in a later change if needed.
- [Stale data can include content withdrawn during an outage] → Cap stale delivery at 24 hours and immediately replace it after the next successful validated refresh.
- [A generic client cannot infer domain validity] → Make validation mandatory for every opt-in cached content query and cover each repository query with contract tests.
- [Detail IDs can create high-cardinality keys] → Enforce the 500-entry LRU bound and avoid logging raw query variables.
- [Caching could mask readiness failures] → Keep readiness explicitly uncached and test repeated live probes.

## Migration Plan

1. Add and unit-test the bounded fresh/stale cache primitive and deterministic contract-ID/query/variable cache-key generation.
2. Add an opt-in validated cached-read method to the GraphQL client while retaining the current uncached method.
3. Move Cockpit Card, POI, FAQ, Event, and Featured Project content queries to the cached-read method with query-specific validators; leave readiness uncached.
4. Run repository, gateway, contract, typecheck, lint, build, and strict OpenSpec validation gates.
5. Deploy without data migration. Roll back by reverting the cached-read wiring; no persistent cache state requires cleanup.

## Open Questions

None.
