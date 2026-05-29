import { afterEach, describe, expect, it, vi } from "vitest";

import { GatewayError } from "../src/errors.js";
import { SmartVillageEventRepository } from "../src/content/smart-village-event-repository.js";
import type { EventFilters } from "../src/content/content-repository.js";
import { TTLCache } from "../src/upstream/ttl-cache.js";
import type { SmartVillageEventRecord } from "../src/upstream/smart-village-types.js";

const defaultFilters: EventFilters = {
  pageNumber: 1,
  pageSize: 25,
};

type WarnHook = (message: string, context: Record<string, unknown>) => void;

type GraphQLClientStub = {
  request: ReturnType<typeof vi.fn>;
};

const makeRecord = (
  overrides: Partial<SmartVillageEventRecord> = {},
): SmartVillageEventRecord => ({
  id: "1937530",
  externalId: "99193148",
  title: "Sommerfest",
  description: "Beschreibung",
  visible: true,
  categories: [{ id: "culture", name: "Kultur" }],
  addresses: [
    {
      street: "Ring 55",
      zip: "03172",
      city: "Guben",
      geoLocation: {
        latitude: 51.95,
        longitude: 14.67,
      },
    },
  ],
  location: {
    id: "loc-1",
    name: "Heilsarmee",
    geoLocation: {
      latitude: 51.9,
      longitude: 14.6,
    },
  },
  date: null,
  dates: [
    {
      dateStart: "2026-06-13",
      dateEnd: "2026-06-13",
      timeStart: "15:00",
      timeEnd: "19:00",
    },
  ],
  urls: [{ description: "Mehr", url: "https://example.com" }],
  mediaContents: [{ sourceUrl: { url: "https://example.com/image.jpg", description: null } }],
  ...overrides,
});

const createRepository = (
  client: GraphQLClientStub,
  cacheTtlMs = 60_000,
  warn?: WarnHook,
) =>
  new SmartVillageEventRepository({
    client,
    cacheTtlMs,
    publicBaseUrl: "http://localhost:3000",
    warn,
  });

describe("TTLCache", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns a cached value until the ttl expires", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-29T12:00:00.000Z"));

    const cache = new TTLCache<string, number>({ ttlMs: 1_000 });
    const loader = vi.fn<() => Promise<number>>()
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(2);

    await expect(cache.getOrLoad("alpha", loader)).resolves.toBe(1);
    await expect(cache.getOrLoad("alpha", loader)).resolves.toBe(1);
    expect(loader).toHaveBeenCalledTimes(1);

    vi.setSystemTime(new Date("2026-05-29T12:00:01.001Z"));

    await expect(cache.getOrLoad("alpha", loader)).resolves.toBe(2);
    expect(loader).toHaveBeenCalledTimes(2);
  });

  it("deduplicates identical concurrent loads", async () => {
    let resolveValue: ((value: number) => void) | undefined;
    const cache = new TTLCache<string, number>({ ttlMs: 1_000 });
    const loader = vi.fn(
      () =>
        new Promise<number>((resolve) => {
          resolveValue = resolve;
        }),
    );

    const first = cache.getOrLoad("alpha", loader);
    const second = cache.getOrLoad("alpha", loader);

    expect(loader).toHaveBeenCalledTimes(1);

    resolveValue?.(42);

    await expect(Promise.all([first, second])).resolves.toEqual([42, 42]);
    expect(loader).toHaveBeenCalledTimes(1);
  });
});

describe("SmartVillageEventRepository", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("caches list responses and refreshes them after ttl expiry", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-29T12:00:00.000Z"));

    const client = {
      request: vi
        .fn()
        .mockResolvedValueOnce({ eventRecords: [makeRecord()] })
        .mockResolvedValueOnce({
          eventRecords: [makeRecord({ title: "Sommerfest Reloaded" })],
        }),
    };
    const repository = createRepository(client, 1_000);

    await expect(repository.getEvents("de", defaultFilters)).resolves.toMatchObject({
      events: {
        totalCount: 1,
        results: [{ title: "Sommerfest" }],
        bookingTenants: [],
      },
    });
    await expect(repository.getEvents("de", { ...defaultFilters })).resolves.toMatchObject({
      events: {
        totalCount: 1,
        results: [{ title: "Sommerfest" }],
      },
    });

    expect(client.request).toHaveBeenCalledTimes(1);

    vi.setSystemTime(new Date("2026-05-29T12:00:01.001Z"));

    await expect(repository.getEvents("de", defaultFilters)).resolves.toMatchObject({
      events: {
        totalCount: 1,
        results: [{ title: "Sommerfest Reloaded" }],
      },
    });
    expect(client.request).toHaveBeenCalledTimes(2);
  });

  it("caches detail responses separately from list responses", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-29T12:00:00.000Z"));

    const client = {
      request: vi
        .fn()
        .mockImplementation(async (query: string) => {
          if (query.includes("eventRecords")) {
            return { eventRecords: [makeRecord()] };
          }

          return { eventRecord: makeRecord() };
        }),
    };
    const repository = createRepository(client, 1_000);
    const id = "1937530:2026-06-13:15%3A00";

    await repository.getEvents("de", defaultFilters);
    await repository.getEventById("de", id);
    await repository.getEventById("de", id);

    expect(client.request).toHaveBeenCalledTimes(2);

    vi.setSystemTime(new Date("2026-05-29T12:00:01.001Z"));

    await repository.getEventById("de", id);
    expect(client.request).toHaveBeenCalledTimes(3);
  });

  it("deduplicates identical concurrent list requests to one GraphQL call", async () => {
    let resolveResponse:
      | ((value: { eventRecords: SmartVillageEventRecord[] }) => void)
      | undefined;

    const client = {
      request: vi.fn(
        () =>
          new Promise<{ eventRecords: SmartVillageEventRecord[] }>((resolve) => {
            resolveResponse = resolve;
          }),
      ),
    };
    const repository = createRepository(client);

    const first = repository.getEvents("de", {
      pageNumber: 1,
      pageSize: 10,
      title: "Sommer",
    });
    const second = repository.getEvents("de", {
      title: "Sommer",
      pageSize: 10,
      pageNumber: 1,
    });

    expect(client.request).toHaveBeenCalledTimes(1);

    resolveResponse?.({ eventRecords: [makeRecord()] });

    const [left, right] = await Promise.all([first, second]);

    expect(left.events.results).toHaveLength(1);
    expect(right.events.results).toHaveLength(1);
    expect(client.request).toHaveBeenCalledTimes(1);
  });

  it("deduplicates identical concurrent detail requests to one GraphQL call", async () => {
    let resolveResponse:
      | ((value: { eventRecord: SmartVillageEventRecord | null }) => void)
      | undefined;

    const client = {
      request: vi.fn(
        () =>
          new Promise<{ eventRecord: SmartVillageEventRecord | null }>((resolve) => {
            resolveResponse = resolve;
          }),
      ),
    };
    const repository = createRepository(client);
    const id = "1937530:2026-06-13:15%3A00";

    const first = repository.getEventById("de", id);
    const second = repository.getEventById("de", id);

    expect(client.request).toHaveBeenCalledTimes(1);

    resolveResponse?.({ eventRecord: makeRecord() });

    const [left, right] = await Promise.all([first, second]);

    expect(left.event.id).toBe(id);
    expect(right.event.id).toBe(id);
    expect(client.request).toHaveBeenCalledTimes(1);
  });

  it("paginates after expanding records into occurrences", async () => {
    const client = {
      request: vi.fn(async () => ({
        eventRecords: [
          makeRecord({
            dates: [
              {
                dateStart: "2026-06-13",
                dateEnd: "2026-06-13",
                timeStart: "15:00",
                timeEnd: "19:00",
              },
              {
                dateStart: "2026-06-14",
                dateEnd: "2026-06-14",
                timeStart: "10:00",
                timeEnd: "12:00",
              },
            ],
          }),
          makeRecord({
            id: "1937531",
            externalId: "99193149",
            title: "Lesung",
            dates: [
              {
                dateStart: "2026-06-15",
                dateEnd: "2026-06-15",
                timeStart: "18:00",
                timeEnd: "20:00",
              },
            ],
          }),
        ],
      })),
    };
    const repository = createRepository(client);

    const result = await repository.getEvents("de", {
      pageNumber: 2,
      pageSize: 1,
      sortBy: "startDate",
      ordering: "asc",
    });

    expect(result.events.totalCount).toBe(3);
    expect(result.events.pageCount).toBe(3);
    expect(result.events.results.map((event) => event.id)).toEqual([
      "1937530:2026-06-14:10%3A00",
    ]);
  });

  it("filters occurrences by title, category, and date overlap while skipping malformed occurrences", async () => {
    const client = {
      request: vi.fn(async () => ({
        eventRecords: [
          makeRecord({
            dates: [
              {
                dateStart: null,
                dateEnd: "2026-06-18",
                timeStart: "18:00",
                timeEnd: "20:00",
              },
              {
                dateStart: "2026-06-18",
                dateEnd: "2026-06-18",
                timeStart: "18:00",
                timeEnd: "20:00",
              },
            ],
          }),
          makeRecord({
            id: "1937531",
            externalId: "99193149",
            title: "Wintermarkt",
            categories: [{ id: "market", name: "Markt" }],
            dates: [
              {
                dateStart: "2026-06-18",
                dateEnd: "2026-06-18",
                timeStart: "10:00",
                timeEnd: "12:00",
              },
            ],
          }),
          makeRecord({
            id: "1937532",
            externalId: "99193150",
            title: "Sommerlesung",
            dates: [
              {
                dateStart: "2026-07-05",
                dateEnd: "2026-07-05",
                timeStart: "18:00",
                timeEnd: "20:00",
              },
            ],
          }),
        ],
      })),
    };
    const repository = createRepository(client);

    const result = await repository.getEvents("de", {
      pageNumber: 1,
      pageSize: 10,
      title: "Sommer",
      category: "culture",
      startDate: "2026-06-14T00:00:00.000Z",
      endDate: "2026-06-30T23:59:59.000Z",
    });

    expect(result.events.totalCount).toBe(1);
    expect(result.events.results.map((event) => event.id)).toEqual([
      "1937530:2026-06-18:18%3A00",
    ]);
    expect(result.events.categories).toEqual([{ id: "culture", name: "Kultur" }]);
    expect(result.events.bookingTenants).toEqual([]);
    expect(result.page.seo.canonical).toBe("http://localhost:3000/events");
    expect(result.seo.title).toBe("Veranstaltungen");
  });

  it("logs context when malformed upstream records or occurrences are skipped", async () => {
    const warn = vi.fn<WarnHook>();
    const client = {
      request: vi.fn(async () => ({
        eventRecords: [
          makeRecord({
            id: null,
            externalId: "99193148",
          }),
          makeRecord({
            id: "1937531",
            externalId: "99193149",
            dates: [
              {
                dateStart: null,
                dateEnd: "2026-06-18",
                timeStart: "18:00",
                timeEnd: "20:00",
              },
              {
                dateStart: "2026-06-18",
                dateEnd: "2026-06-18",
                timeStart: "19:00",
                timeEnd: "20:00",
              },
            ],
          }),
        ],
      })),
    };
    const repository = createRepository(client, 60_000, warn);

    const result = await repository.getEvents("de", defaultFilters);

    expect(result.events.totalCount).toBe(1);
    expect(warn).toHaveBeenCalledTimes(2);
    expect(warn).toHaveBeenNthCalledWith(
      1,
      "Skipped malformed Smart Village event record/occurrence during mapping",
      expect.objectContaining({
        internalId: null,
        externalId: "99193148",
        title: "Sommerfest",
        occurrenceCandidates: 1,
        mappedOccurrences: 0,
      }),
    );
    expect(warn).toHaveBeenNthCalledWith(
      2,
      "Skipped malformed Smart Village event record/occurrence during mapping",
      expect.objectContaining({
        internalId: "1937531",
        externalId: "99193149",
        title: "Sommerfest",
        occurrenceCandidates: 2,
        mappedOccurrences: 1,
      }),
    );
  });

  it("resolves a decoded synthetic occurrence id back to the parent internal id for detail lookups", async () => {
    const client = {
      request: vi.fn(async (_query: string, variables?: Record<string, unknown>) => {
        expect(variables).toEqual({ id: "1937530" });
        return {
          eventRecord: makeRecord({
            dates: [
              {
                dateStart: "2026-06-13",
                dateEnd: "2026-06-13",
                timeStart: "15:00",
                timeEnd: "19:00",
              },
              {
                dateStart: "2026-06-14",
                dateEnd: "2026-06-14",
                timeStart: "10:00",
                timeEnd: "12:00",
              },
            ],
          }),
        };
      }),
    };
    const repository = createRepository(client);
    const id = "1937530:2026-06-14:10:00";

    const result = await repository.getEventById("de", id);

    expect(result.event).toMatchObject({
      id: "1937530:2026-06-14:10%3A00",
      eventId: "99193148",
      terminId: "1937530:2026-06-14:10%3A00",
      title: "Sommerfest",
    });
    expect(result.seo.canonical).toBe("http://localhost:3000/events/1937530:2026-06-14:10%3A00");
  });

  it("returns a 404 when the requested occurrence cannot be resolved", async () => {
    const client = {
      request: vi.fn(async () => ({
        eventRecord: makeRecord(),
      })),
    };
    const repository = createRepository(client);

    await expect(
      repository.getEventById("de", "1937530:2026-06-14:10%3A00"),
    ).rejects.toBeInstanceOf(GatewayError);
    await expect(
      repository.getEventById("de", "1937530:2026-06-14:10%3A00"),
    ).rejects.toMatchObject({
      code: "NOT_FOUND",
      statusCode: 404,
      upstream: "gateway",
      retryable: false,
    });
  });
});
