import { beforeEach, describe, expect, it, vi } from "vitest";

import { GatewayError } from "../src/errors.js";
import { requestJson } from "../src/upstream/request-json.js";

describe("requestJson", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns parsed JSON from a successful request", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: vi.fn(async () => ({ ok: true })),
    } as unknown as Response);

    await expect(
      requestJson<{ ok: boolean }>({
        url: "http://postgrest.test/events",
        timeoutMs: 100,
        retryAttempts: 0,
        retryBackoffMs: 0,
        upstream: "postgrest",
      }),
    ).resolves.toEqual({ ok: true });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://postgrest.test/events",
      expect.objectContaining({
        method: "GET",
      }),
    );
  });

  it("retries retryable upstream failures and eventually succeeds", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce({
        ok: false,
        status: 503,
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: vi.fn(async () => ({ items: [1, 2] })),
      } as unknown as Response);

    await expect(
      requestJson<{ items: number[] }>({
        url: "http://postgrest.test/retry",
        timeoutMs: 100,
        retryAttempts: 1,
        retryBackoffMs: 0,
        upstream: "postgrest",
      }),
    ).resolves.toEqual({ items: [1, 2] });

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("raises a timeout gateway error after the final abort", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(
      new DOMException("The operation was aborted.", "AbortError"),
    );

    await expect(
      requestJson({
        url: "http://postgrest.test/slow",
        timeoutMs: 1,
        retryAttempts: 0,
        retryBackoffMs: 0,
        upstream: "postgrest",
      }),
    ).rejects.toMatchObject({
      code: "UPSTREAM_TIMEOUT",
      statusCode: 503,
      upstream: "postgrest",
      retryable: true,
    });
  });

  it("raises an unavailable gateway error for unexpected failures", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("socket hang up"));

    await expect(
      requestJson({
        url: "http://postgrest.test/fail",
        timeoutMs: 100,
        retryAttempts: 0,
        retryBackoffMs: 0,
        upstream: "postgrest",
      }),
    ).rejects.toMatchObject({
      code: "UPSTREAM_UNAVAILABLE",
      statusCode: 503,
      upstream: "postgrest",
      retryable: true,
    });
  });
});
