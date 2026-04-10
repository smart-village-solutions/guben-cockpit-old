import { afterEach, describe, expect, it, vi } from "vitest";

import type { PostgrestConfig } from "../src/config.js";

const config: PostgrestConfig = {
  PORT: 5100,
  LOG_LEVEL: "silent",
  PUBLIC_BASE_URL: "http://localhost:3000",
  MASTERPORTAL_URL: "http://masterportal",
  CONTENT_SOURCE_MODE: "postgrest",
  DEFAULT_LANGUAGE: "de",
  FALLBACK_LANGUAGE: "de",
  POSTGREST_URL: "https://postgrest.example.com/",
  POSTGREST_TIMEOUT_MS: 1500,
  POSTGREST_SCHEMA: "public_content",
};

describe("PostgrestClient", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.resetModules();
  });

  it("builds requests with normalized base URL, query params and schema headers", async () => {
    const requestJson = vi.fn(async () => [{ id: "row-1" }]);
    vi.doMock("../src/upstream/request-json.js", () => ({
      requestJson,
    }));

    const { PostgrestClient: FreshClient } = await import("../src/upstream/postgrest-client.js");

    const client = new FreshClient(config);
    const result = await client.select<{ id: string }>("pages", {
      id: "eq.home",
      limit: 1,
      ignored: undefined,
    });

    expect(result).toEqual([{ id: "row-1" }]);
    expect(requestJson).toHaveBeenCalledWith({
      url: "https://postgrest.example.com/pages?id=eq.home&limit=1",
      timeoutMs: 1500,
      retryAttempts: 0,
      retryBackoffMs: 0,
      upstream: "postgrest",
      headers: {
        Accept: "application/json",
        "Accept-Profile": "public_content",
        "Content-Profile": "public_content",
      },
    });
  });

  it("reports readiness based on the upstream root response", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response(null, { status: 200 }))
      .mockRejectedValueOnce(new Error("network down"));

    const { PostgrestClient } = await import("../src/upstream/postgrest-client.js");
    const client = new PostgrestClient(config);

    await expect(client.checkReadiness()).resolves.toBe(true);
    await expect(client.checkReadiness()).resolves.toBe(false);

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "https://postgrest.example.com/",
      expect.objectContaining({
        headers: {
          Accept: "application/json",
        },
      }),
    );
  });
});
