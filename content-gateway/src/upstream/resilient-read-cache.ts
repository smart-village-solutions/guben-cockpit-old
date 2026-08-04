const DEFAULT_FRESH_MS = 4 * 60_000;
const DEFAULT_STALE_MS = 24 * 60 * 60_000;
const DEFAULT_MAX_ENTRIES = 500;

type CacheEntry<Value> = {
  value: Value;
  validatedAt: number;
};

export type ResilientReadCacheOptions = {
  freshMs?: number;
  staleMs?: number;
  maxEntries?: number;
  now?: () => number;
};

export class ResilientReadCache<Value = unknown> {
  private readonly entries = new Map<string, CacheEntry<Value>>();
  private readonly inFlightLoads = new Map<string, Promise<Value>>();
  private readonly freshMs: number;
  private readonly staleMs: number;
  private readonly maxEntries: number;

  public constructor(private readonly options: ResilientReadCacheOptions = {}) {
    this.freshMs = options.freshMs ?? DEFAULT_FRESH_MS;
    this.staleMs = options.staleMs ?? DEFAULT_STALE_MS;
    this.maxEntries = options.maxEntries ?? DEFAULT_MAX_ENTRIES;
    if (this.freshMs < 0 || this.staleMs < this.freshMs || this.maxEntries < 1) {
      throw new Error("Invalid resilient read cache options");
    }
  }

  public async getOrLoad<T extends Value>(key: string, load: () => Promise<T>): Promise<T> {
    const cached = this.entries.get(key) as CacheEntry<T> | undefined;
    const now = this.now();
    if (cached && now - cached.validatedAt < this.freshMs) {
      this.touch(key, cached);
      return cached.value;
    }

    const inFlight = this.inFlightLoads.get(key) as Promise<T> | undefined;
    if (inFlight) return inFlight;

    const loadPromise = this.refresh(key, cached, load);
    this.inFlightLoads.set(key, loadPromise as Promise<Value>);
    try {
      return await loadPromise;
    } finally {
      this.inFlightLoads.delete(key);
    }
  }

  private async refresh<T extends Value>(
    key: string,
    cached: CacheEntry<T> | undefined,
    load: () => Promise<T>,
  ): Promise<T> {
    try {
      const value = await load();
      this.entries.delete(key);
      this.entries.set(key, { value, validatedAt: this.now() });
      this.evictIfNeeded();
      return value;
    } catch (error) {
      if (cached && this.now() - cached.validatedAt <= this.staleMs) {
        this.touch(key, cached);
        return cached.value;
      }
      if (cached) this.entries.delete(key);
      throw error;
    }
  }

  private touch(key: string, entry: CacheEntry<Value>) {
    this.entries.delete(key);
    this.entries.set(key, entry);
    this.evictIfNeeded();
  }

  private evictIfNeeded() {
    while (this.entries.size > this.maxEntries) {
      const oldestKey = this.entries.keys().next().value as string | undefined;
      if (oldestKey === undefined) return;
      this.entries.delete(oldestKey);
    }
  }

  private now() {
    return this.options.now?.() ?? Date.now();
  }
}
