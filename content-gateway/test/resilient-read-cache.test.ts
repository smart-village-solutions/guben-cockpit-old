import { describe, expect, it, vi } from "vitest";

import { ResilientReadCache } from "../src/upstream/resilient-read-cache.js";

describe("ResilientReadCache", () => {
  it("serves fresh values and refreshes expired entries", async () => {
    let now = 0;
    const cache = new ResilientReadCache({ freshMs: 10, staleMs: 100, now: () => now });
    const load = vi.fn(async () => `value-${load.mock.calls.length}`);

    await expect(cache.getOrLoad("key", load)).resolves.toBe("value-1");
    now = 9;
    await expect(cache.getOrLoad("key", load)).resolves.toBe("value-1");
    now = 10;
    await expect(cache.getOrLoad("key", load)).resolves.toBe("value-2");
    expect(load).toHaveBeenCalledTimes(2);
  });

  it("serves stale on error until maximum age and recovers", async () => {
    let now = 0;
    const cache = new ResilientReadCache<string>({ freshMs: 10, staleMs: 100, now: () => now });
    await cache.getOrLoad("key", async () => "old");
    now = 10;
    await expect(cache.getOrLoad("key", async () => { throw new Error("down"); })).resolves.toBe("old");
    await expect(cache.getOrLoad("key", async () => "new")).resolves.toBe("new");
    now = 111;
    await expect(cache.getOrLoad("key", async () => { throw new Error("down"); })).rejects.toThrow("down");
  });

  it("coalesces parallel loads and keeps distinct keys separate", async () => {
    const cache = new ResilientReadCache<string>();
    let resolve!: (value: string) => void;
    const load = vi.fn(() => new Promise<string>((done) => { resolve = done; }));
    const first = cache.getOrLoad("a", load);
    const second = cache.getOrLoad("a", load);
    const other = cache.getOrLoad("b", async () => "other");
    resolve("shared");
    await expect(Promise.all([first, second, other])).resolves.toEqual(["shared", "shared", "other"]);
    expect(load).toHaveBeenCalledTimes(1);
  });

  it("evicts the least recently used entry", async () => {
    const cache = new ResilientReadCache<string>({ maxEntries: 2 });
    const load = vi.fn(async (value: string) => value);
    await cache.getOrLoad("a", () => load("a"));
    await cache.getOrLoad("b", () => load("b"));
    await cache.getOrLoad("a", () => load("a-new"));
    await cache.getOrLoad("c", () => load("c"));
    await expect(cache.getOrLoad("b", () => load("b-new"))).resolves.toBe("b-new");
    expect(load).toHaveBeenCalledTimes(4);
  });
});
