import { afterEach, describe, expect, it, vi } from "vitest";

import { createCachedReadKey, SmartVillageGraphQLClient } from "../src/upstream/smart-village-graphql-client.js";

describe("SmartVillageGraphQLClient", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("sends GraphQL requests with a bearer token", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: vi.fn(async () => ({ data: { eventRecords: [] } })),
    } as unknown as Response);

    const oauthClient = { getAccessToken: vi.fn(async () => "token-1") };
    const client = new SmartVillageGraphQLClient({
      graphqlUrl: "https://example.com/graphql",
      oauthClient,
    });

    await expect(
      client.request<{ eventRecords: [] }>("query { eventRecords { id } }", { limit: 1 }),
    ).resolves.toEqual({ eventRecords: [] });

    expect(oauthClient.getAccessToken).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://example.com/graphql",
      expect.objectContaining({
        method: "POST",
        headers: {
          authorization: "Bearer token-1",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          query: "query { eventRecords { id } }",
          variables: { limit: 1 },
        }),
      }),
    );
  });

  it("raises a standardized gateway error when GraphQL reports errors", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: vi.fn(async () => ({
        errors: [{ message: "upstream exploded" }],
      })),
    } as unknown as Response);

    const client = new SmartVillageGraphQLClient({
      graphqlUrl: "https://example.com/graphql",
      oauthClient: { getAccessToken: vi.fn(async () => "token-1") },
    });

    await expect(client.request("query { eventRecords { id } }")).rejects.toMatchObject({
      code: "UPSTREAM_UNAVAILABLE",
      statusCode: 503,
      upstream: "smartvillage",
      retryable: true,
    });
  });

  it("raises an invalid payload gateway error when GraphQL data is missing", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: vi.fn(async () => ({})),
    } as unknown as Response);

    const client = new SmartVillageGraphQLClient({
      graphqlUrl: "https://example.com/graphql",
      oauthClient: { getAccessToken: vi.fn(async () => "token-1") },
    });

    await expect(client.request("query { eventRecords { id } }")).rejects.toMatchObject({
      code: "INVALID_UPSTREAM_PAYLOAD",
      statusCode: 502,
      upstream: "smartvillage",
      retryable: false,
    });
  });

  it("caches validated reads and keeps the uncached path live", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: vi.fn(async () => ({ data: { items: [] } })),
    } as unknown as Response);
    const client = new SmartVillageGraphQLClient({
      graphqlUrl: "https://example.com/graphql",
      oauthClient: { getAccessToken: vi.fn(async () => "token-1") },
    });
    const read = () => client.requestCached({
      contractId: "items.v1",
      query: "query Items { items { id } }",
      validate: (response: { items?: unknown[] }) => {
        if (!Array.isArray(response.items)) throw new Error("invalid");
      },
    });

    await read();
    await read();
    await client.request("query Items { items { id } }");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("serves the last valid response after validation failure", async () => {
    let now = 0;
    const responses = [{ data: { items: ["old"] } }, { data: { items: null } }];
    vi.spyOn(globalThis, "fetch").mockImplementation(async () => ({
      ok: true,
      json: vi.fn(async () => responses.shift()),
    } as unknown as Response));
    const client = new SmartVillageGraphQLClient({
      graphqlUrl: "https://example.com/graphql",
      oauthClient: { getAccessToken: vi.fn(async () => "token-1") },
      readCacheOptions: { freshMs: 10, staleMs: 100, now: () => now },
    });
    const options = {
      contractId: "items.v1",
      query: "query Items { items }",
      validate: (response: { items: unknown }) => {
        if (!Array.isArray(response.items)) throw new Error("invalid");
      },
    };
    await expect(client.requestCached(options)).resolves.toEqual({ items: ["old"] });
    now = 10;
    await expect(client.requestCached(options)).resolves.toEqual({ items: ["old"] });
  });

  it("exhausts transport retries before serving stale data", async () => {
    let now = 0;
    const fetchMock = vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce({
        ok: true,
        json: vi.fn(async () => ({ data: { items: ["old"] } })),
      } as unknown as Response)
      .mockRejectedValue(new Error("down"));
    const client = new SmartVillageGraphQLClient({
      graphqlUrl: "https://example.com/graphql",
      oauthClient: { getAccessToken: vi.fn(async () => "token-1") },
      retryAttempts: 1,
      retryBackoffMs: 0,
      readCacheOptions: { freshMs: 10, staleMs: 100, now: () => now },
    });
    const options = {
      contractId: "items.v1",
      query: "query Items { items }",
      validate: (response: { items: unknown }) => {
        if (!Array.isArray(response.items)) throw new Error("invalid");
      },
    };

    await client.requestCached(options);
    now = 10;
    await expect(client.requestCached(options)).resolves.toEqual({ items: ["old"] });
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("canonicalizes variables and isolates validator contracts", () => {
    expect(createCachedReadKey("a", "query", { nested: { b: 2, a: 1 } }))
      .toBe(createCachedReadKey("a", "query", { nested: { a: 1, b: 2 } }));
    expect(createCachedReadKey("a", "query")).toBe(createCachedReadKey("a", "query", {}));
    expect(createCachedReadKey("a", "query", {})).not.toBe(createCachedReadKey("b", "query", {}));
  });

  it("stores a valid absent detail result instead of resurrecting stale content", async () => {
    let now = 0;
    const responses = [{ data: { item: { id: "1" } } }, { data: { item: null } }];
    vi.spyOn(globalThis, "fetch").mockImplementation(async () => ({
      ok: true,
      json: vi.fn(async () => responses.shift()),
    } as unknown as Response));
    const client = new SmartVillageGraphQLClient({
      graphqlUrl: "https://example.com/graphql",
      oauthClient: { getAccessToken: vi.fn(async () => "token-1") },
      readCacheOptions: { freshMs: 10, staleMs: 100, now: () => now },
    });
    const options = {
      contractId: "item.detail.v1",
      query: "query Item { item { id } }",
      validate: (response: { item?: { id: string } | null }) => {
        if (!Object.hasOwn(response, "item")) throw new Error("invalid");
      },
    };

    await expect(client.requestCached(options)).resolves.toEqual({ item: { id: "1" } });
    now = 10;
    await expect(client.requestCached(options)).resolves.toEqual({ item: null });
    await expect(client.requestCached(options)).resolves.toEqual({ item: null });
  });
});
