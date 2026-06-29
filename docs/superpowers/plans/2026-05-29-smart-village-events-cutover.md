# Smart Village Events Cutover Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the gateway's current event source with the Smart Village GraphQL API, map one Smart Village occurrence to one frontend event, and keep the frontend event endpoints and pages working with minimal UI changes.

**Architecture:** Keep PostgREST as the source for non-event public content, but route all event list and detail reads through new Smart Village OAuth, GraphQL, mapping, and cache components in `content-gateway`. Use a repository wrapper so `/api/content/events` and `/api/content/events/:id` switch to Smart Village without forcing the rest of the gateway off its existing PostgREST-backed code paths.

**Tech Stack:** TypeScript, Fastify, Vitest, Zod, native `fetch`, Smart Village GraphQL over OAuth client credentials, in-memory TTL caching.

---

## File Structure

- Create: `content-gateway/src/upstream/smart-village-types.ts`
  - GraphQL response types and occurrence helper types used by the mapper and repository
- Create: `content-gateway/src/upstream/smart-village-oauth-client.ts`
  - OAuth client-credentials token acquisition with in-memory token reuse
- Create: `content-gateway/src/upstream/smart-village-graphql-client.ts`
  - Authenticated GraphQL request client for Smart Village
- Create: `content-gateway/src/upstream/ttl-cache.ts`
  - Generic in-memory TTL cache with in-flight request deduplication
- Create: `content-gateway/src/content/smart-village-event-mapper.ts`
  - Maps `EventRecord` plus occurrence dates to the shared `Event` contract
- Create: `content-gateway/src/content/smart-village-event-repository.ts`
  - Fetches, filters, caches, paginates, and resolves Smart Village events/details
- Create: `content-gateway/src/content/smart-village-postgrest-content-repository.ts`
  - Delegates non-event reads to `PostgrestContentRepository` and event reads to the new Smart Village event repository
- Modify: `content-gateway/src/config.ts`
  - Final Smart Village config validation and event-cutover requirements
- Modify: `content-gateway/src/content/content-repository.ts`
  - Export new repository wrapper and any shared filter typing needed by both repos
- Modify: `content-gateway/src/server.ts`
  - Wire new clients/repositories and readiness behavior
- Modify: `content-gateway/src/upstream/request-json.ts`
  - Generalize upstream typing and retry/error reuse for Smart Village requests
- Modify: `content-gateway/test/config.test.ts`
  - Cover required Smart Village config for event cutover
- Modify: `content-gateway/test/app.test.ts`
  - Verify the unchanged HTTP contract still works with the new repository shape
- Modify: `content-gateway/test/server.test.ts`
  - Verify bootstrap wiring and readiness checks include Smart Village event dependencies
- Modify: `docker-compose.yml`
  - Pass Smart Village variables to the gateway container
- Modify: `docker-compose.local.env.example`
  - Document local Smart Village config
- Modify: `stack.prod.yml`
  - Pass Smart Village variables to the production gateway
- Modify: `stack.prod.env.example`
  - Document production Smart Village variables
- Test: `content-gateway/test/request-json.test.ts`
  - Preserve generic upstream request behavior after Smart Village support
- Test: `content-gateway/test/smart-village-oauth-client.test.ts`
- Test: `content-gateway/test/smart-village-graphql-client.test.ts`
- Test: `content-gateway/test/smart-village-event-mapper.test.ts`
- Test: `content-gateway/test/smart-village-event-repository.test.ts`

### Task 1: Finalize Event-Cutover Configuration

**Files:**
- Modify: `content-gateway/src/config.ts`
- Modify: `content-gateway/test/config.test.ts`
- Modify: `docker-compose.yml`
- Modify: `docker-compose.local.env.example`
- Modify: `stack.prod.yml`
- Modify: `stack.prod.env.example`

- [ ] **Step 1: Write the failing config tests**

Add tests that require all `SV_*` variables when the gateway is running in the normal non-mock stack and that reject partial Smart Village configuration.

```ts
it("requires Smart Village event configuration in postgrest mode", () => {
  expect(() =>
    loadConfig({
      CONTENT_SOURCE_MODE: "postgrest",
      PUBLIC_BASE_URL: "http://localhost:3000",
      MASTERPORTAL_URL: "http://masterportal",
      POSTGREST_URL: "http://localhost:3001",
    }),
  ).toThrow(/SV_GRAPHQL_URL, SV_OAUTH_TOKEN_URL, SV_CLIENT_ID, SV_CLIENT_SECRET/);
});

it("accepts complete Smart Village event configuration in postgrest mode", () => {
  const config = loadConfig({
    CONTENT_SOURCE_MODE: "postgrest",
    PUBLIC_BASE_URL: "http://localhost:3000",
    MASTERPORTAL_URL: "http://masterportal",
    POSTGREST_URL: "http://localhost:3001",
    SV_GRAPHQL_URL: "https://bb-guben.server.smart-village.app/graphql",
    SV_OAUTH_TOKEN_URL: "https://bb-guben.server.smart-village.app/oauth/token",
    SV_CLIENT_ID: "application-id",
    SV_CLIENT_SECRET: "application-secret",
  });

  expect(config.SV_GRAPHQL_URL).toBe("https://bb-guben.server.smart-village.app/graphql");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --run test/config.test.ts`
Expected: FAIL because `loadConfig` still allows postgrest mode without complete Smart Village event configuration.

- [ ] **Step 3: Tighten config validation and keep env docs aligned**

Require the full Smart Village config set for the real gateway stack while keeping `mock` mode usable for tests.

```ts
const smartVillageFields = [
  "SV_GRAPHQL_URL",
  "SV_OAUTH_TOKEN_URL",
  "SV_CLIENT_ID",
  "SV_CLIENT_SECRET",
] as const;

const ensureRequiredSmartVillageConfig = (config: Config) => {
  if (config.CONTENT_SOURCE_MODE !== "postgrest") {
    return config;
  }

  const missing = smartVillageFields.filter((field) => {
    const value = config[field];
    return typeof value !== "string" || value.trim().length === 0;
  });

  if (missing.length > 0) {
    throw new Error(`Smart Village upstream configuration requires all of: ${smartVillageFields.join(", ")}`);
  }

  return config;
};

export const loadConfig = (env: NodeJS.ProcessEnv = process.env): Config => {
  const normalizedEnv = {
    ...env,
    CONTENT_SOURCE_MODE: env.CONTENT_SOURCE_MODE ?? "mock",
  };

  const parsedConfig =
    normalizedEnv.CONTENT_SOURCE_MODE === "postgrest"
      ? postgrestConfigSchema.parse(normalizedEnv)
      : mockConfigSchema.parse(normalizedEnv);

  return ensureRequiredSmartVillageConfig(parsedConfig);
};
```

Document the same variables in `docker-compose.local.env.example` and `stack.prod.env.example`, and pass them through `docker-compose.yml` and `stack.prod.yml`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- --run test/config.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add content-gateway/src/config.ts content-gateway/test/config.test.ts docker-compose.yml docker-compose.local.env.example stack.prod.yml stack.prod.env.example
git commit -m "feat: require Smart Village event configuration"
```

### Task 2: Build Smart Village OAuth and GraphQL Upstream Clients

**Files:**
- Modify: `content-gateway/src/upstream/request-json.ts`
- Modify: `content-gateway/test/request-json.test.ts`
- Create: `content-gateway/src/upstream/smart-village-oauth-client.ts`
- Create: `content-gateway/src/upstream/smart-village-graphql-client.ts`
- Create: `content-gateway/src/upstream/smart-village-types.ts`
- Test: `content-gateway/test/smart-village-oauth-client.test.ts`
- Test: `content-gateway/test/smart-village-graphql-client.test.ts`

- [ ] **Step 1: Write the failing OAuth and GraphQL client tests**

Add focused client tests for:
- token reuse before expiry
- token refresh after expiry
- GraphQL request with bearer token
- GraphQL error propagation

```ts
it("reuses an unexpired Smart Village access token", async () => {
  const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
    ok: true,
    json: vi.fn(async () => ({
      access_token: "token-1",
      token_type: "Bearer",
      expires_in: 3600,
    })),
  } as unknown as Response);

  const client = new SmartVillageOAuthClient({
    tokenUrl: "https://example.com/oauth/token",
    clientId: "id",
    clientSecret: "secret",
  });

  await expect(client.getAccessToken()).resolves.toBe("token-1");
  await expect(client.getAccessToken()).resolves.toBe("token-1");
  expect(fetchMock).toHaveBeenCalledTimes(1);
});
```

```ts
it("sends GraphQL requests with a bearer token", async () => {
  vi.spyOn(globalThis, "fetch").mockResolvedValue({
    ok: true,
    json: vi.fn(async () => ({ data: { eventRecords: [] } })),
  } as unknown as Response);

  const oauthClient = { getAccessToken: vi.fn(async () => "token-1") };
  const client = new SmartVillageGraphQLClient({
    graphqlUrl: "https://example.com/graphql",
    oauthClient,
  });

  await client.request<{ eventRecords: [] }>("query { eventRecords { id } }");

  expect(fetch).toHaveBeenCalledWith(
    "https://example.com/graphql",
    expect.objectContaining({
      method: "POST",
      headers: expect.objectContaining({
        Authorization: "Bearer token-1",
      }),
    }),
  );
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- --run test/smart-village-oauth-client.test.ts test/smart-village-graphql-client.test.ts`
Expected: FAIL because the new clients do not exist yet.

- [ ] **Step 3: Implement generic upstream reuse plus Smart Village clients**

Generalize `request-json.ts` to support both upstream names and add Smart Village clients that build on it.

```ts
type RequestJsonOptions = {
  url: string;
  method?: string;
  headers?: HeadersInit;
  body?: string;
  timeoutMs: number;
  retryAttempts: number;
  retryBackoffMs: number;
  upstream: "postgrest" | "smartvillage";
};
```

```ts
export class SmartVillageOAuthClient {
  private cachedToken:
    | {
        accessToken: string;
        expiresAt: number;
      }
    | null = null;

  public constructor(
    private readonly options: {
      tokenUrl: string;
      clientId: string;
      clientSecret: string;
      timeoutMs?: number;
    },
  ) {}

  public async getAccessToken(): Promise<string> {
    if (this.cachedToken && this.cachedToken.expiresAt > Date.now() + 60_000) {
      return this.cachedToken.accessToken;
    }

    const payload = await requestJson<{
      access_token: string;
      expires_in: number;
      token_type: string;
    }>({
      url: this.options.tokenUrl,
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: this.options.clientId,
        client_secret: this.options.clientSecret,
      }).toString(),
      timeoutMs: this.options.timeoutMs ?? 10_000,
      retryAttempts: 1,
      retryBackoffMs: 250,
      upstream: "smartvillage",
    });

    this.cachedToken = {
      accessToken: payload.access_token,
      expiresAt: Date.now() + payload.expires_in * 1000,
    };

    return this.cachedToken.accessToken;
  }
}
```

```ts
export class SmartVillageGraphQLClient {
  public constructor(
    private readonly options: {
      graphqlUrl: string;
      oauthClient: { getAccessToken(): Promise<string> };
      timeoutMs?: number;
    },
  ) {}

  public async request<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
    const token = await this.options.oauthClient.getAccessToken();
    const response = await requestJson<{
      data?: T;
      errors?: Array<{ message: string }>;
    }>({
      url: this.options.graphqlUrl,
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ query, variables }),
      timeoutMs: this.options.timeoutMs ?? 15_000,
      retryAttempts: 1,
      retryBackoffMs: 250,
      upstream: "smartvillage",
    });

    if (response.errors?.length) {
      throw new GatewayError({
        code: "UPSTREAM_UNAVAILABLE",
        message: response.errors[0]?.message ?? "smartvillage request failed",
        statusCode: 503,
        upstream: "smartvillage",
        retryable: true,
      });
    }

    if (!response.data) {
      throw new GatewayError({
        code: "INVALID_UPSTREAM_PAYLOAD",
        message: "smartvillage response did not include data",
        statusCode: 502,
        upstream: "smartvillage",
        retryable: false,
      });
    }

    return response.data;
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- --run test/request-json.test.ts test/smart-village-oauth-client.test.ts test/smart-village-graphql-client.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add content-gateway/src/upstream/request-json.ts content-gateway/test/request-json.test.ts content-gateway/src/upstream/smart-village-types.ts content-gateway/src/upstream/smart-village-oauth-client.ts content-gateway/src/upstream/smart-village-graphql-client.ts content-gateway/test/smart-village-oauth-client.test.ts content-gateway/test/smart-village-graphql-client.test.ts
git commit -m "feat: add Smart Village upstream clients"
```

### Task 3: Map Smart Village Event Records to Frontend Events

**Files:**
- Create: `content-gateway/src/content/smart-village-event-mapper.ts`
- Create: `content-gateway/test/smart-village-event-mapper.test.ts`

- [ ] **Step 1: Write the failing mapper tests**

Cover:
- one `dates[]` entry becomes one event
- multiple `dates[]` entries become multiple events
- `date` fallback when `dates[]` is empty
- image URL duplication into all image variants
- address/location field merge
- deterministic synthetic IDs

```ts
it("expands one EventRecord into one event per occurrence", () => {
  const mapper = new SmartVillageEventMapper({
    PUBLIC_BASE_URL: "http://localhost:3000",
    FALLBACK_LANGUAGE: "de",
  } as Config);

  const events = mapper.eventsFromRecord({
    id: "1937530",
    externalId: "99193148",
    title: "Sommerfest",
    description: "Beschreibung",
    visible: true,
    categories: [{ id: "910", name: "Fest / Brauchtum" }],
    addresses: [{ street: "Ring 55", zip: "03172", city: "Guben", geoLocation: { latitude: 51.95, longitude: 14.67 } }],
    location: { id: "loc-1", name: "Heilsarmee", geoLocation: null },
    date: null,
    dates: [
      { dateStart: "2026-06-13", dateEnd: "2026-06-13", timeStart: "15:00", timeEnd: "19:00", timeDescription: "", weekday: null, useOnlyTimeDescription: "false" },
      { dateStart: "2026-06-14", dateEnd: "2026-06-14", timeStart: "10:00", timeEnd: "12:00", timeDescription: "", weekday: null, useOnlyTimeDescription: "false" },
    ],
    urls: [{ description: "Mehr", url: "https://example.com" }],
    mediaContents: [{ sourceUrl: { url: "https://example.com/image.jpg", description: null } }],
  });

  expect(events).toHaveLength(2);
  expect(events[0]).toMatchObject({
    eventId: "99193148",
    title: "Sommerfest",
    location: {
      name: "Heilsarmee",
      street: "Ring 55",
      zip: "03172",
      city: "Guben",
    },
    images: [
      {
        originalUrl: "https://example.com/image.jpg",
        previewUrl: "https://example.com/image.jpg",
        thumbnailUrl: "https://example.com/image.jpg",
      },
    ],
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --run test/smart-village-event-mapper.test.ts`
Expected: FAIL because the mapper does not exist yet.

- [ ] **Step 3: Implement occurrence explosion and field mapping**

```ts
export class SmartVillageEventMapper {
  public constructor(private readonly config: Config) {}

  public eventsFromRecord(record: SmartVillageEventRecord): Event[] {
    const occurrences = this.getOccurrences(record);
    return occurrences
      .map((occurrence, occurrenceIndex) => this.eventFromOccurrence(record, occurrence, occurrenceIndex))
      .filter((event): event is Event => event !== null);
  }

  public eventFromOccurrence(
    record: SmartVillageEventRecord,
    occurrence: SmartVillageEventOccurrence,
    occurrenceIndex: number,
  ): Event | null {
    if (!record.title || !occurrence.dateStart) {
      return null;
    }

    const locationAddress = record.addresses[0];
    const coordinates = locationAddress?.geoLocation ?? record.location?.geoLocation ?? null;
    const occurrenceId = this.buildOccurrenceId(record, occurrence, occurrenceIndex);

    return eventsContentSchema.shape.events.shape.results.element.parse({
      id: occurrenceId,
      eventId: record.externalId ?? String(record.id),
      terminId: occurrenceId,
      title: record.title,
      description: record.description ?? "",
      startDate: this.toIsoStart(occurrence),
      endDate: this.toIsoEnd(occurrence),
      location: {
        id: String(record.location?.id ?? record.id),
        name: record.location?.name ?? record.title,
        city: locationAddress?.city ?? null,
        street: locationAddress?.street ?? null,
        telephoneNumber: null,
        fax: null,
        email: null,
        website: null,
        zip: locationAddress?.zip ?? null,
      },
      coordinates: coordinates
        ? {
            latitude: coordinates.latitude,
            longitude: coordinates.longitude,
          }
        : null,
      urls: (record.urls ?? []).map((url) => ({
        link: url.url,
        description: url.description ?? "",
      })),
      categories: (record.categories ?? []).map((category) => ({
        id: String(category.id),
        name: category.name ?? String(category.id),
      })),
      images: (record.mediaContents ?? [])
        .map((media) => media.sourceUrl?.url)
        .filter((url): url is string => Boolean(url))
        .map((url) => ({
          originalUrl: url,
          previewUrl: url,
          thumbnailUrl: url,
        })),
      published: record.visible ?? false,
    });
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- --run test/smart-village-event-mapper.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add content-gateway/src/content/smart-village-event-mapper.ts content-gateway/test/smart-village-event-mapper.test.ts
git commit -m "feat: map Smart Village event records to frontend events"
```

### Task 4: Add TTL Caching and Smart Village Event Repository

**Files:**
- Create: `content-gateway/src/upstream/ttl-cache.ts`
- Create: `content-gateway/src/content/smart-village-event-repository.ts`
- Create: `content-gateway/test/smart-village-event-repository.test.ts`

- [ ] **Step 1: Write the failing repository and cache tests**

Cover:
- list cache hit/miss
- detail cache hit/miss
- in-flight deduplication for identical list requests
- pagination after occurrence expansion
- detail lookup by synthetic occurrence ID
- skip malformed list occurrences but 404 missing detail occurrences

```ts
it("deduplicates identical in-flight list requests", async () => {
  const requestEvents = vi.fn(async () => ({
    eventRecords: [makeEventRecordWithTwoDates()],
  }));

  const repository = new SmartVillageEventRepository({
    graphqlClient: { request: requestEvents } as any,
    mapper: new SmartVillageEventMapper(baseConfig),
    listCacheTtlMs: 15 * 60 * 1000,
    detailCacheTtlMs: 30 * 60 * 1000,
  });

  const [first, second] = await Promise.all([
    repository.getEvents("de", { pageNumber: 1, pageSize: 25 }),
    repository.getEvents("de", { pageNumber: 1, pageSize: 25 }),
  ]);

  expect(requestEvents).toHaveBeenCalledTimes(1);
  expect(first.events.results).toEqual(second.events.results);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --run test/smart-village-event-repository.test.ts`
Expected: FAIL because the TTL cache and repository do not exist yet.

- [ ] **Step 3: Implement the TTL cache and repository**

```ts
export class TTLCache<T> {
  private readonly entries = new Map<string, { value: T; expiresAt: number }>();
  private readonly inFlight = new Map<string, Promise<T>>();

  public async getOrLoad(key: string, ttlMs: number, loader: () => Promise<T>): Promise<T> {
    const cached = this.entries.get(key);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.value;
    }

    const existingLoad = this.inFlight.get(key);
    if (existingLoad) {
      return existingLoad;
    }

    const loadPromise = loader()
      .then((value) => {
        this.entries.set(key, {
          value,
          expiresAt: Date.now() + ttlMs,
        });
        return value;
      })
      .finally(() => {
        this.inFlight.delete(key);
      });

    this.inFlight.set(key, loadPromise);
    return loadPromise;
  }
}
```

```ts
export class SmartVillageEventRepository {
  private readonly listCache = new TTLCache<EventsContent>();
  private readonly detailCache = new TTLCache<EventDetailContent>();

  public constructor(
    private readonly options: {
      graphqlClient: SmartVillageGraphQLClient;
      mapper: SmartVillageEventMapper;
      listCacheTtlMs: number;
      detailCacheTtlMs: number;
    },
  ) {}

  public async getEvents(language: string, filters: EventFilters): Promise<EventsContent> {
    const cacheKey = JSON.stringify({ language, filters });
    return this.listCache.getOrLoad(cacheKey, this.options.listCacheTtlMs, async () => {
      const data = await this.options.graphqlClient.request<{ eventRecords: SmartVillageEventRecord[] }>(
        SMART_VILLAGE_EVENT_RECORDS_QUERY,
        this.buildEventVariables(filters),
      );

      const expanded = data.eventRecords.flatMap((record) => this.options.mapper.eventsFromRecord(record));
      const filtered = this.applyLocalFilters(expanded, filters);
      const paged = this.slicePage(filtered, filters.pageNumber ?? 1, filters.pageSize ?? 25);

      return eventsContentSchema.parse({
        page: {
          id: "Events",
          title: "Veranstaltungen",
          description: "",
          seo: this.buildSeo(language),
        },
        events: {
          pageNumber: filters.pageNumber ?? 1,
          pageSize: filters.pageSize ?? 25,
          totalCount: filtered.length,
          pageCount: Math.max(1, Math.ceil(filtered.length / (filters.pageSize ?? 25))),
          results: paged,
          categories: this.collectCategories(filtered),
          bookingTenants: [],
        },
        seo: this.buildSeo(language),
      });
    });
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- --run test/smart-village-event-repository.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add content-gateway/src/upstream/ttl-cache.ts content-gateway/src/content/smart-village-event-repository.ts content-gateway/test/smart-village-event-repository.test.ts
git commit -m "feat: add cached Smart Village event repository"
```

### Task 5: Integrate Smart Village Events into the Public Content Repository and Server

**Files:**
- Create: `content-gateway/src/content/smart-village-postgrest-content-repository.ts`
- Modify: `content-gateway/src/content/content-repository.ts`
- Modify: `content-gateway/src/server.ts`
- Modify: `content-gateway/test/app.test.ts`
- Modify: `content-gateway/test/server.test.ts`

- [ ] **Step 1: Write the failing integration tests**

Add tests that prove:
- the app still serves `/api/content/events` and `/api/content/events/:id` through `PublicContentRepository`
- bootstrap wires a Smart Village-backed repository in postgrest mode
- readiness includes Smart Village event dependencies

```ts
it("wires Smart Village events through the server bootstrap in postgrest mode", async () => {
  const createApp = vi.fn(() => ({
    listen: vi.fn(async () => undefined),
    log: { error: vi.fn() },
  }));

  vi.doMock("../src/content/content-repository.js", () => ({
    MockContentRepository: class MockContentRepository {},
    PostgrestContentRepository: class PostgrestContentRepository {},
    SmartVillagePostgrestContentRepository: class SmartVillagePostgrestContentRepository {
      public constructor() {}
    },
  }));

  await import("../src/server.js");

  expect(createApp).toHaveBeenCalled();
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- --run test/app.test.ts test/server.test.ts`
Expected: FAIL because the new repository wrapper and readiness wiring do not exist yet.

- [ ] **Step 3: Implement the wrapper repository and server wiring**

```ts
export class SmartVillagePostgrestContentRepository implements PublicContentRepository {
  public constructor(
    private readonly postgrestRepository: PostgrestContentRepository,
    private readonly eventRepository: SmartVillageEventRepository,
  ) {}

  public getHome(language: string) {
    return this.postgrestRepository.getHome(language);
  }

  public getProjects(language: string, pageNumber: number, pageSize: number) {
    return this.postgrestRepository.getProjects(language, pageNumber, pageSize);
  }

  public getEvents(language: string, filters: EventFilters) {
    return this.eventRepository.getEvents(language, filters);
  }

  public getEventById(language: string, id: string) {
    return this.eventRepository.getEventById(language, id);
  }

  public getDashboard(language: string) {
    return this.postgrestRepository.getDashboard(language);
  }

  public getMap(language: string) {
    return this.postgrestRepository.getMap(language);
  }

  public getFooter() {
    return this.postgrestRepository.getFooter();
  }

  public getBookingTenants() {
    return this.postgrestRepository.getBookingTenants();
  }
}
```

```ts
const postgrestClient = config.CONTENT_SOURCE_MODE === "postgrest" ? new PostgrestClient(config) : null;

const repository =
  config.CONTENT_SOURCE_MODE === "mock"
    ? new MockContentRepository()
    : new SmartVillagePostgrestContentRepository(
        new PostgrestContentRepository(config, postgrestClient!),
        new SmartVillageEventRepository({
          graphqlClient: new SmartVillageGraphQLClient({
            graphqlUrl: config.SV_GRAPHQL_URL,
            oauthClient: new SmartVillageOAuthClient({
              tokenUrl: config.SV_OAUTH_TOKEN_URL,
              clientId: config.SV_CLIENT_ID,
              clientSecret: config.SV_CLIENT_SECRET,
            }),
          }),
          mapper: new SmartVillageEventMapper(config),
          listCacheTtlMs: 15 * 60 * 1000,
          detailCacheTtlMs: 30 * 60 * 1000,
        }),
      );
```

For readiness, include both `postgrest` and a lightweight Smart Village check, such as a minimal `eventRecords(limit: 1)` request.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- --run test/app.test.ts test/server.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add content-gateway/src/content/smart-village-postgrest-content-repository.ts content-gateway/src/content/content-repository.ts content-gateway/src/server.ts content-gateway/test/app.test.ts content-gateway/test/server.test.ts
git commit -m "feat: route public events through Smart Village"
```

### Task 6: End-to-End Verification and Cleanup

**Files:**
- Modify: `content-gateway/test/postgrest-content-repository.test.ts`
- Modify: `content-gateway/test/content-repository.test.ts`
- Modify: `content-gateway/src/content/postgrest-content-repository.ts`
- Modify: `README.md`
- Modify: `docs/deploy-runbook.md`

- [ ] **Step 1: Write the failing cleanup/contract tests**

Add or update tests to prove:
- the shared repository export surface still matches the app contract
- the old PostgREST event path is no longer used by the runtime wrapper

```ts
it("keeps the public repository contract intact after the Smart Village cutover", async () => {
  const repository = new SmartVillagePostgrestContentRepository(
    postgrestRepositoryStub,
    smartVillageEventRepositoryStub,
  );

  await expect(repository.getEvents("de", { pageNumber: 1, pageSize: 25 })).resolves.toMatchObject({
    events: {
      results: expect.any(Array),
    },
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- --run test/content-repository.test.ts test/postgrest-content-repository.test.ts`
Expected: FAIL because the repository contract and docs are not fully aligned to the new Smart Village event path.

- [ ] **Step 3: Remove dead event-only assumptions and update docs**

Clean out stale event-only assumptions from the PostgREST repository and document the new operational requirements.

```md
## Smart Village events

Production now requires:

- `SV_GRAPHQL_URL`
- `SV_OAUTH_TOKEN_URL`
- `SV_CLIENT_ID`
- `SV_CLIENT_SECRET`

Public event responses are sourced from Smart Village via the content gateway. Other public content remains on PostgREST.
```

If `PostgrestContentRepository` still contains event-only code that is no longer used after the wrapper is introduced, remove or isolate it so future maintenance is explicit.

- [ ] **Step 4: Run full gateway verification**

Run: `npm test`
Expected: PASS

Run: `npm run typecheck`
Expected: PASS

Run: `npm run build`
Expected: PASS

Manual smoke checks after starting the gateway with real `SV_*` credentials:

```bash
curl -fsS "http://127.0.0.1:5100/api/content/events?pageNumber=1&pageSize=5" | jq '.events.results[0] | {id,title,startDate,endDate}'
curl -fsS "http://127.0.0.1:5100/api/content/events?pageNumber=1&pageSize=5" | jq '.events.results[0].id' -r | xargs -I{} curl -fsS "http://127.0.0.1:5100/api/content/events/{}" | jq '.event.title'
```

Expected:
- first command returns Smart Village-derived event data
- second command resolves the synthetic detail ID successfully

- [ ] **Step 5: Commit**

```bash
git add content-gateway/test/postgrest-content-repository.test.ts content-gateway/test/content-repository.test.ts content-gateway/src/content/postgrest-content-repository.ts README.md docs/deploy-runbook.md
git commit -m "docs: finalize Smart Village event cutover"
```

## Self-Review

- Spec coverage checked:
  - Smart Village as sole event source: covered by Tasks 4 and 5
  - One frontend event per occurrence: covered by Task 3
  - Minimal frontend change: preserved by Tasks 3 and 5
  - 15 to 30 minute cache: covered by Task 4
  - No runtime switch: covered by Task 5
  - Follow-up GraphQL migrations explicitly out of scope: reflected in Task 6 docs only
- Placeholder scan completed:
  - no `TBD`, `TODO`, or “similar to” references
- Type consistency checked:
  - `SmartVillageOAuthClient`, `SmartVillageGraphQLClient`, `SmartVillageEventMapper`, `SmartVillageEventRepository`, and `SmartVillagePostgrestContentRepository` are referenced consistently across tasks
