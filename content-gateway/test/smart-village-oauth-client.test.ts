import { afterEach, describe, expect, it, vi } from "vitest";

import { SmartVillageOAuthClient } from "../src/upstream/smart-village-oauth-client.js";

describe("SmartVillageOAuthClient", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

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
    expect(fetchMock).toHaveBeenCalledWith(
      "https://example.com/oauth/token",
      expect.objectContaining({
        method: "POST",
        headers: {
          "content-type": "application/x-www-form-urlencoded",
        },
        body: "grant_type=client_credentials&client_id=id&client_secret=secret",
      }),
    );
  });

  it("refreshes the access token once it crosses the expiry threshold", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-29T12:00:00.000Z"));

    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce({
        ok: true,
        json: vi.fn(async () => ({
          access_token: "token-1",
          token_type: "Bearer",
          expires_in: 90,
        })),
      } as unknown as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: vi.fn(async () => ({
          access_token: "token-2",
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

    vi.setSystemTime(new Date("2026-05-29T12:00:31.000Z"));

    await expect(client.getAccessToken()).resolves.toBe("token-2");
    expect(fetch).toHaveBeenCalledTimes(2);
  });
});
