import { afterEach, describe, expect, it, vi } from "vitest";

describe("public-content source", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
    delete (globalThis as { location?: Location }).location;
  });

  it("defaults to gateway mode and prefers the configured gateway URL", async () => {
    vi.stubEnv("VITE_PUBLIC_CONTENT_SOURCE", "gateway");
    vi.stubEnv("VITE_CONTENT_GATEWAY_URL", "https://gateway.example.com");

    const source = await import("./source");

    expect(source.publicContentSource).toBe("gateway");
    expect(source.isGatewayPublicContentEnabled).toBe(true);
    expect(source.contentGatewayBaseUrl).toBe("https://gateway.example.com");
  });

  it("falls back to the browser origin when no gateway URL is configured", async () => {
    vi.stubEnv("VITE_PUBLIC_CONTENT_SOURCE", "");
    vi.stubEnv("VITE_CONTENT_GATEWAY_URL", "");
    (globalThis as { location?: { origin: string } }).location = {
      origin: "https://guben.example.com",
    };

    const source = await import("./source");

    expect(source.contentGatewayBaseUrl).toBe("https://guben.example.com");
  });

  it("can disable gateway-backed public content entirely", async () => {
    vi.stubEnv("VITE_PUBLIC_CONTENT_SOURCE", "disabled");

    const source = await import("./source");

    expect(source.publicContentSource).toBe("disabled");
    expect(source.isGatewayPublicContentEnabled).toBe(false);
  });
});
