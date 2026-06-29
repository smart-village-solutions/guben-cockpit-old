import { afterEach, describe, expect, it, vi } from "vitest";

import { SmartVillageGraphQLClient } from "../src/upstream/smart-village-graphql-client.js";

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
});
