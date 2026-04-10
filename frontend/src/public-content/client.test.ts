import { afterEach, describe, expect, it, vi } from "vitest";

describe("fetchGatewayJson", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("builds gateway URLs with defined search params and parses the response", async () => {
    vi.stubEnv("VITE_CONTENT_GATEWAY_URL", "https://gateway.example.com/base/");

    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: vi.fn(async () => ({ page: "ok" })),
    } as unknown as Response);

    const { fetchGatewayJson } = await import("./client");
    const schema = {
      parse: vi.fn((value: unknown) => value),
    };

    const result = await fetchGatewayJson("/api/content/home", schema, {
      lang: "de",
      pageNumber: 2,
      ignored: undefined,
    });

    expect(result).toEqual({ page: "ok" });
    expect(schema.parse).toHaveBeenCalledWith({ page: "ok" });
    expect(fetchMock).toHaveBeenCalledWith(
      "https://gateway.example.com/api/content/home?lang=de&pageNumber=2",
      {
        headers: {
          Accept: "application/json",
        },
      },
    );
  });

  it("raises a typed gateway error when the gateway returns a structured error", async () => {
    vi.stubEnv("VITE_CONTENT_GATEWAY_URL", "https://gateway.example.com");

    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: false,
      status: 503,
      json: vi.fn(async () => ({
        error: {
          code: "UPSTREAM_TIMEOUT",
          message: "Gateway timed out",
          upstream: "gateway",
          retryable: true,
          requestId: "req-1",
        },
      })),
    } as unknown as Response);

    const { GatewayRequestError, fetchGatewayJson } = await import("./client");

    await expect(
      fetchGatewayJson("/api/content/home", { parse: (value: unknown) => value }),
    ).rejects.toBeInstanceOf(GatewayRequestError);

    await expect(
      fetchGatewayJson("/api/content/home", { parse: (value: unknown) => value }),
    ).rejects.toMatchObject({
      status: 503,
      details: expect.objectContaining({
        code: "UPSTREAM_TIMEOUT",
        requestId: "req-1",
      }),
    });
  });

  it("falls back to a generic gateway error for malformed error payloads", async () => {
    vi.stubEnv("VITE_CONTENT_GATEWAY_URL", "https://gateway.example.com");

    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: false,
      status: 502,
      json: vi.fn(async () => ({ message: "bad payload" })),
    } as unknown as Response);

    const { fetchGatewayJson } = await import("./client");

    await expect(
      fetchGatewayJson("/api/content/home", { parse: (value: unknown) => value }),
    ).rejects.toMatchObject({
      status: 502,
      details: expect.objectContaining({
        code: "INTERNAL_ERROR",
        message: "Gateway request failed",
      }),
    });
  });
});
