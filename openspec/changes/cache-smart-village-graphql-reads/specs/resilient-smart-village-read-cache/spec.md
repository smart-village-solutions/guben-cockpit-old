## ADDED Requirements

### Requirement: Shared caching for all Smart Village content reads
The content gateway SHALL use one process-local cache policy for GraphQL reads serving Cockpit Cards, POIs, booking FAQ, Events, Featured Projects, and their available detail queries.

#### Scenario: Repeated content read within the fresh window
- **WHEN** an identical validated Smart Village query and variables are requested again less than four minutes after a successful load
- **THEN** the gateway returns the cached response without issuing another GraphQL request

#### Scenario: Different query variables
- **WHEN** two cached reads use the same query document with different variables such as different detail IDs
- **THEN** the gateway stores and resolves them as distinct cache entries

### Requirement: Fresh content refresh
The cache SHALL treat a successfully validated response as fresh for four minutes and SHALL attempt a new GraphQL read after that fresh window expires.

#### Scenario: Successful refresh after expiration
- **WHEN** a cached entry is older than four minutes and the Mainserver returns a valid response
- **THEN** the gateway returns and stores the new response and resets its freshness and stale age

#### Scenario: Effective visibility with an existing repository cache
- **WHEN** a POI or Event response also passes through its existing one-minute repository cache
- **THEN** a successfully available Mainserver change becomes visible within approximately five minutes

### Requirement: Stale-on-error availability
The cache SHALL return the last successfully validated SVA response when refresh fails and that response is no more than 24 hours old. The cache MUST NOT obtain stale content from PostgREST or another source.

#### Scenario: Transient upstream failure with a usable stale entry
- **WHEN** refresh ends in a timeout, transport error, GraphQL error, or query-specific validation error and the last successful entry is no more than 24 hours old
- **THEN** the gateway returns the last successful SVA response

#### Scenario: Failure without a previous successful entry
- **WHEN** a cached content query fails and no successfully validated entry exists
- **THEN** the original error propagates to the existing repository and UI error or fallback behavior

#### Scenario: Stale entry exceeds the maximum age
- **WHEN** refresh fails and the last successful entry is older than 24 hours
- **THEN** the original error propagates and the expired entry is not returned

#### Scenario: Mainserver recovery
- **WHEN** a query previously returned stale data and a later refresh succeeds with a valid response
- **THEN** the new response replaces the stale entry immediately

### Requirement: Domain validation protects the last good response
Every opt-in cached content query MUST provide query-specific validation, and the cache SHALL promote only a response that passes that validation.

#### Scenario: Valid empty collection
- **WHEN** a query returns the expected collection as an empty array and its domain contract permits an empty result
- **THEN** the empty response is stored as the latest successful value

#### Scenario: Invalid collection response
- **WHEN** a response omits its required collection or returns it with an invalid shape
- **THEN** the response does not replace the previous successful cache entry

#### Scenario: Query-specific contract violation
- **WHEN** a response violates an invariant that currently fails its repository request, such as duplicate Featured Project external IDs
- **THEN** the response does not replace the previous successful cache entry

#### Scenario: Detail content was deleted upstream
- **WHEN** a detail refresh returns a domain-valid absent result such as `null` or an empty detail collection
- **THEN** the absent result replaces the previous successful cache entry and the repository applies its existing `NOT_FOUND` behavior instead of returning stale deleted content

#### Scenario: Skippable malformed individual record
- **WHEN** an expected collection is valid but contains an individual record that the repository contract intentionally skips with a warning
- **THEN** the collection remains eligible for caching and existing record-level handling is preserved

### Requirement: Concurrent identical reads are coalesced
The cache SHALL allow at most one in-flight load for an identical query key.

#### Scenario: Parallel cache miss
- **WHEN** multiple callers request the same uncached query and variables before the first GraphQL response completes
- **THEN** one GraphQL request is issued and all callers receive its resulting value or error behavior

#### Scenario: Parallel expired refresh
- **WHEN** multiple callers request the same expired entry while its refresh is in progress
- **THEN** one refresh is issued and all callers share the refreshed or stale-on-error result

### Requirement: Cache storage is bounded
The cache SHALL apply least-recently-used eviction with a default maximum of 500 stored entries.

#### Scenario: Capacity is exceeded
- **WHEN** adding a validated response would exceed the configured entry limit
- **THEN** the least recently used stored entry is evicted

#### Scenario: Recently read entry
- **WHEN** a stored entry is read before another entry is added at capacity
- **THEN** that entry is treated as recently used and a less recently used entry is evicted first

### Requirement: Only explicit reads are cached
Caching SHALL be opt-in for content reads, MUST NOT cache mutations, and SHALL derive keys from a stable validator-contract ID, the query document, and canonically serialized variables without OAuth credentials or other secrets. Equivalent variable objects with different property insertion order and equivalent absent variables SHALL resolve to the same key.

#### Scenario: Content read opts into caching
- **WHEN** a repository issues an explicitly cached GraphQL content read with a validator
- **THEN** the client derives its key from the validator-contract ID, query document, and canonical variables only

#### Scenario: Equivalent variables use one cache entry
- **WHEN** cached reads use the same validator-contract ID and query with semantically equivalent variables whose object properties have different insertion order or whose variables are equivalently absent
- **THEN** the reads resolve to the same cache entry

#### Scenario: Different validation contracts are isolated
- **WHEN** cached reads use identical query documents and variables but different validator-contract IDs
- **THEN** the reads use distinct cache entries and cannot consume a response accepted only by the other contract

#### Scenario: Uncached request
- **WHEN** a caller uses the normal uncached GraphQL request path
- **THEN** the client issues a live request regardless of matching cached content

### Requirement: Readiness reflects the live Mainserver
The content-gateway readiness probe MUST bypass the content cache.

#### Scenario: Mainserver fails while stale content exists
- **WHEN** cached SVA content remains usable but a live readiness GraphQL request fails
- **THEN** readiness reports the Smart Village dependency as not ready

#### Scenario: Repeated readiness checks
- **WHEN** readiness is checked repeatedly within four minutes
- **THEN** each check performs a live Mainserver request rather than returning a cached readiness response

### Requirement: Public behavior remains compatible
The caching change MUST preserve public gateway response schemas, routes, filters, sorting, UI rendering, and current caller-specific fallback behavior.

#### Scenario: Cache serves a fresh or stale response
- **WHEN** any cached SVA response is returned
- **THEN** consumers receive the same validated public contract as before the caching change

#### Scenario: Cockpit Card cache is unavailable
- **WHEN** no fresh or eligible stale Cockpit Card response is available and the GraphQL read fails
- **THEN** the existing dashboard enrichment layer may use its established local Cockpit Card fallback

#### Scenario: Non-card cache is unavailable
- **WHEN** no fresh or eligible stale POI, FAQ, Event, or Featured Project response is available and the GraphQL read fails
- **THEN** no new PostgREST content fallback is introduced
