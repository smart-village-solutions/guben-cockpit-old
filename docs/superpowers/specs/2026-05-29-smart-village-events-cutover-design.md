# Smart Village Events Cutover Design

Date: 2026-05-29

## Goal

Replace the current event source with the Smart Village GraphQL API while keeping the frontend event experience largely unchanged.

The Smart Village API becomes the single source of truth for events. The change is intentionally scoped to events only. Other content areas may later be migrated to GraphQL, but that follow-up work is explicitly out of scope for this design.

## Scope

In scope:
- Replace the gateway implementation of `/api/content/events`
- Replace the gateway implementation of `/api/content/events/:id`
- Introduce Smart Village OAuth and GraphQL clients inside `content-gateway`
- Map Smart Village `EventRecord` data into the existing frontend-oriented event contract with only minimal contract changes if needed
- Add server-side caching for Smart Village event reads

Out of scope:
- Migrating projects, map, footer, dashboard, or other public content to GraphQL
- Large frontend redesigns
- A runtime source switch or dual-source fallback mode
- Richer use of Smart Village event metadata beyond what is needed for the current frontend

## Constraints

- The frontend should require as little change as possible.
- Speed to delivery matters more than perfect domain purity.
- Event IDs and URLs may change.
- Each Smart Village date occurrence should become its own frontend event.
- Event freshness only needs to be editorially sufficient, not real-time.
- Smart Village remains the only event source after cutover.

## Current State

Today the public events flow uses the gateway's PostgREST-backed repository and maps rows into the shared `eventSchema`. The frontend consumes `/api/content/events` and `/api/content/events/:id` and assumes:

- one event record per displayable occurrence
- a single `startDate` and `endDate` per event
- a flat location object with address fields
- image variants `thumbnailUrl`, `previewUrl`, and `originalUrl`

Smart Village differs in three important ways:

- one `EventRecord` can contain multiple dates in `dates[]`
- address and location data are split across `addresses[]` and `location`
- media currently exposes a source URL, not frontend-ready image variants

## Target Architecture

The public gateway remains the only browser-facing API. The frontend continues to call the same endpoints.

New gateway components:

- `SmartVillageOAuthClient`
  - fetches client-credentials access tokens
  - caches the current token until shortly before expiry

- `SmartVillageGraphQLClient`
  - executes authenticated GraphQL requests against `SV_GRAPHQL_URL`

- `SmartVillageEventMapper`
  - maps `EventRecord` plus date occurrences into the shared event contract

- `SmartVillageEventRepository` or equivalent event-specific gateway path
  - provides `getEvents` and `getEventById`
  - owns filtering, pagination, and cache usage for Smart Village events

- `TTLCache`
  - in-memory cache for event list and detail responses
  - supports in-flight request deduplication

Unchanged areas:

- PostgREST continues to serve projects, map, dashboard, footer, and other public content
- `CONTENT_SOURCE_MODE=postgrest` remains valid for the rest of the stack

## Request Flow

### Event list

1. Browser requests `/api/content/events`
2. Gateway parses the existing query parameters
3. Gateway builds a cache key from language plus filters
4. Gateway serves from cache if fresh
5. On cache miss, gateway fetches Smart Village data through OAuth + GraphQL
6. Gateway explodes `dates[]` into single-occurrence events
7. Gateway maps the results into the frontend event contract
8. Gateway applies pagination and returns the existing response shape

### Event detail

1. Browser requests `/api/content/events/:id`
2. Gateway checks detail cache
3. On cache miss, gateway resolves the synthetic occurrence ID back to the underlying Smart Village event plus date occurrence
4. Gateway maps the occurrence to the event contract and returns it

## Mapping Design

### Core rule

One Smart Village `EventRecord` becomes one frontend event per occurrence:

- use `dates[]` when present
- if `dates[]` is empty, fall back to `date`
- if neither yields a valid occurrence, drop the record

### Field mapping

- `id`
  - synthetic occurrence ID, stable for a given event occurrence
  - built from Smart Village event identity plus occurrence date/time

- `eventId`
  - `externalId` if present
  - otherwise Smart Village `id`

- `terminId`
  - synthetic occurrence ID component derived from the concrete date occurrence

- `title`
  - `EventRecord.title`

- `description`
  - `EventRecord.description`

- `startDate`
  - composed from occurrence `dateStart` plus `timeStart`
  - if no time exists, normalize to an all-day-compatible timestamp

- `endDate`
  - composed from occurrence `dateEnd` plus `timeEnd`
  - if no end is present, fall back to start semantics compatible with the current frontend

- `location.name`
  - `EventRecord.location.name`

- `location.street`, `location.zip`, `location.city`
  - from `addresses[0]`

- `coordinates`
  - from `addresses[0].geoLocation`
  - fallback to `location.geoLocation`

- `urls`
  - from `EventRecord.urls`
  - `link <- url`
  - `description <- description`

- `categories`
  - from `EventRecord.categories`

- `images`
  - from `EventRecord.mediaContents[*].sourceUrl.url`
  - use the same URL for `thumbnailUrl`, `previewUrl`, and `originalUrl` in phase 1

- `published`
  - derived from `visible`

### Intentional phase-1 omissions

The following Smart Village data is not required for the first cutover and should not delay delivery:

- organizer details
- contacts
- prices
- recurrence metadata beyond occurrence expansion
- data provider metadata
- settings/payload fields

These can be integrated later if the frontend needs them.

## Synthetic IDs

Because URLs may change, we do not preserve existing IDs.

Requirement:
- the generated event occurrence ID must be deterministic and reproducible across cache refreshes

Recommended shape:
- base event identity from `externalId` or Smart Village `id`
- append occurrence-specific date/time data

Example shape:
- `base-id:dateStart:timeStart-or-all-day`

The exact encoding can be implementation-defined as long as it is stable and safe for URLs.

## Filtering and Pagination

The frontend should continue to use the current event list parameters.

Gateway behavior:
- translate current gateway filters into Smart Village GraphQL arguments when possible
- apply any remaining normalization-aware filtering after occurrence expansion

Expected phase-1 behavior:
- search by title/description if supported by the upstream query strategy
- category filtering
- date range filtering
- distance filtering after coordinate mapping
- sorting consistent with current frontend expectations

Pagination should happen after mapping and filtering of occurrences so the frontend sees page counts based on actual displayable events rather than parent `EventRecord` objects.

## Caching Strategy

### Token cache

- cache the OAuth access token in memory
- refresh shortly before expiry
- never request a new token per GraphQL call

### Event list cache

- in-memory TTL cache
- freshness target: 15 to 30 minutes
- key includes language and all effective event filter parameters
- deduplicate identical concurrent misses through an in-flight promise registry

### Event detail cache

- in-memory TTL cache
- can be slightly longer than list cache
- keyed by language plus synthetic event occurrence ID

### Fallback behavior

- if upstream fails and a fresh cache entry exists, serve the cached value
- if no usable cache exists, return the normal gateway error response

## Error Handling

List endpoint:
- skip malformed individual Smart Village records or malformed occurrences
- log enough context to diagnose the offending upstream data
- only fail the full response when the result set cannot be produced meaningfully

Detail endpoint:
- if the requested synthetic occurrence cannot be resolved, return `404`
- if upstream is unavailable and no valid cached detail exists, return a gateway error

Validation rules:
- required frontend contract fields must still be enforced before responding
- do not emit partial objects that break the frontend contract

## Rollout Plan

1. Add Smart Village configuration, OAuth client, GraphQL client, mapper, and cache support in `content-gateway`
2. Replace the event repository path used by `/api/content/events` and `/api/content/events/:id`
3. Keep all non-event public content on PostgREST
4. Validate locally against the real Smart Village API
5. Run smoke tests for:
   - `/api/content/events`
   - `/api/content/events/:id`
   - frontend event list
   - frontend event detail pages
6. Deploy with `SV_*` secrets configured in production
7. Remove any obsolete PostgREST-only event logic that is no longer used

There is no runtime source switch and no dual-source fallback mode.

## Testing Strategy

Gateway tests:
- OAuth token caching
- GraphQL client error handling
- event occurrence explosion from `dates[]`
- deterministic synthetic ID generation
- mapping of addresses, location, categories, URLs, and images
- list filtering and pagination after occurrence expansion
- detail lookup by synthetic ID
- cache hit, miss, expiry, and in-flight deduplication behavior

Frontend verification:
- existing event pages should continue to render without structural changes
- detail routes must work with the new synthetic IDs

Operational verification:
- real API smoke tests using configured Smart Village credentials

## Risks and Mitigations

### Upstream schema or payload variance

Risk:
- real Smart Village payloads may omit fields that are present in introspection

Mitigation:
- defensive mapping
- explicit validation
- per-record skip behavior for list responses

### Multiple occurrences per event inflate counts unexpectedly

Risk:
- pagination totals and category counts change compared to the old source

Mitigation:
- define occurrence-level pagination as the intended new behavior
- verify with real event list expectations during smoke tests

### Synthetic ID instability

Risk:
- detail URLs break between refreshes if occurrence IDs are not deterministic

Mitigation:
- derive IDs only from stable upstream identifiers and occurrence date/time values
- cover with repeatable tests

### Cache serving stale editorial data too long

Risk:
- users see outdated events longer than desired

Mitigation:
- use a moderate 15 to 30 minute TTL
- keep cache scope limited to the gateway process

## Future Follow-Up

After the event cutover, other content elements may be migrated to the GraphQL API as separate follow-up work. That future migration should reuse lessons from this event adapter, but it does not change the implementation or scope of this design.
