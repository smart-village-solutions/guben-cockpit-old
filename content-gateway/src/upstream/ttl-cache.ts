type TTLCacheOptions = {
  ttlMs: number;
  now?: () => number;
};

type CacheEntry<Value> = {
  value: Value;
  expiresAt: number;
};

export class TTLCache<Key, Value> {
  private readonly entries = new Map<Key, CacheEntry<Value>>();
  private readonly inFlightLoads = new Map<Key, Promise<Value>>();

  public constructor(private readonly options: TTLCacheOptions) {}

  public async getOrLoad(key: Key, load: () => Promise<Value>): Promise<Value> {
    const cachedEntry = this.entries.get(key);
    if (cachedEntry && cachedEntry.expiresAt > this.now()) {
      return cachedEntry.value;
    }

    const inFlightLoad = this.inFlightLoads.get(key);
    if (inFlightLoad) {
      return inFlightLoad;
    }

    const loadPromise = this.loadAndCache(key, load);
    this.inFlightLoads.set(key, loadPromise);

    try {
      return await loadPromise;
    } finally {
      this.inFlightLoads.delete(key);
    }
  }

  public clear(key?: Key) {
    if (key === undefined) {
      this.entries.clear();
      this.inFlightLoads.clear();
      return;
    }

    this.entries.delete(key);
    this.inFlightLoads.delete(key);
  }

  private async loadAndCache(key: Key, load: () => Promise<Value>): Promise<Value> {
    const value = await load();

    this.entries.set(key, {
      value,
      expiresAt: this.now() + this.options.ttlMs,
    });

    return value;
  }

  private now() {
    return this.options.now?.() ?? Date.now();
  }
}
