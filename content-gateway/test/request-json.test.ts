import { beforeEach, describe, expect, it, vi } from "vitest";

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

  it("does not retry a non-retryable HTTP failure", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: false,
      status: 404,
    } as Response);

    await expect(requestJson({
      url: "http://postgrest.test/missing",
      timeoutMs: 100,
      retryAttempts: 2,
      retryBackoffMs: 0,
      upstream: "postgrest",
    })).rejects.toMatchObject({
      code: "UPSTREAM_UNAVAILABLE",
      message: "postgrest request failed with status 404",
      retryable: false,
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("retries network failures before returning their final gateway error", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("socket hang up"));

    await expect(requestJson({
      url: "http://postgrest.test/fail",
      timeoutMs: 100,
      retryAttempts: 1,
      retryBackoffMs: 0,
      upstream: "postgrest",
    })).rejects.toMatchObject({ code: "UPSTREAM_UNAVAILABLE", retryable: true });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("waits for each linear backoff and gives attempts independent timeout signals", async () => {
    vi.useFakeTimers();
    try {
      const fetchMock = vi.spyOn(globalThis, "fetch")
        .mockRejectedValueOnce(new Error("first failure"))
        .mockRejectedValueOnce(new Error("second failure"))
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ ok: true }) } as Response);
      const result = requestJson({
        url: "http://postgrest.test/retry",
        timeoutMs: 1000,
        retryAttempts: 2,
        retryBackoffMs: 100,
        upstream: "postgrest",
      });
      await vi.advanceTimersByTimeAsync(0);
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(vi.getTimerCount()).toBe(1);
      await vi.advanceTimersByTimeAsync(99);
      expect(fetchMock).toHaveBeenCalledTimes(1);
      await vi.advanceTimersByTimeAsync(1);
      expect(fetchMock).toHaveBeenCalledTimes(2);
      await vi.advanceTimersByTimeAsync(199);
      expect(fetchMock).toHaveBeenCalledTimes(2);
      await vi.advanceTimersByTimeAsync(1);
      await expect(result).resolves.toEqual({ ok: true });
      expect(fetchMock).toHaveBeenCalledTimes(3);
      const signals = fetchMock.mock.calls.map(([, init]) => init?.signal);
      expect(new Set(signals).size).toBe(3);
      expect(signals.every((signal) => signal?.aborted === false)).toBe(true);
      expect(vi.getTimerCount()).toBe(0);
    } finally {
      vi.useRealTimers();
    }
  });

  it("aborts a timed-out attempt before backing off and retrying", async () => {
    vi.useFakeTimers();
    try {
      const fetchMock = vi.spyOn(globalThis, "fetch")
        .mockImplementationOnce((_url, init) => new Promise((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () => {
            reject(new DOMException("Aborted", "AbortError"));
          });
        }))
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ ok: true }) } as Response);
      const result = requestJson({
        url: "http://postgrest.test/retry",
        timeoutMs: 50,
        retryAttempts: 1,
        retryBackoffMs: 100,
        upstream: "postgrest",
      });
      await vi.advanceTimersByTimeAsync(50);
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(fetchMock.mock.calls[0]?.[1]?.signal?.aborted).toBe(true);
      expect(vi.getTimerCount()).toBe(1);
      await vi.advanceTimersByTimeAsync(100);
      await expect(result).resolves.toEqual({ ok: true });
      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(fetchMock.mock.calls[1]?.[1]?.signal?.aborted).toBe(false);
      expect(vi.getTimerCount()).toBe(0);
    } finally {
      vi.useRealTimers();
    }
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

  it("uses the provided smartvillage upstream name in timeout errors", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(
      new DOMException("The operation was aborted.", "AbortError"),
    );

    await expect(
      requestJson({
        url: "http://smartvillage.test/graphql",
        method: "POST",
        timeoutMs: 1,
        retryAttempts: 0,
        retryBackoffMs: 0,
        upstream: "smartvillage",
      }),
    ).rejects.toMatchObject({
      code: "UPSTREAM_TIMEOUT",
      statusCode: 503,
      upstream: "smartvillage",
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
