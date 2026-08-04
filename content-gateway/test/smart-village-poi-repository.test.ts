import { describe, expect, it, vi } from "vitest";

import { SmartVillagePoiRepository, POINTS_OF_INTEREST_QUERY, POINT_OF_INTEREST_QUERY } from "../src/content/smart-village-poi-repository.js";
import type { PoiFilters } from "../../shared/public-content/contracts.js";
import { representativeSmartVillagePois } from "./fixtures/smart-village-pois.js";

const filters: PoiFilters = {
  categoryIds: [],
  sort: "name",
  direction: "asc",
  pageNumber: 1,
  pageSize: 12,
};

const makePoi = (overrides: Record<string, unknown> = {}) => ({
  id: "1",
  externalId: "legacy-1",
  name: "Unternehmen A",
  description: "Beschreibung",
  active: true,
  visible: true,
  updatedAt: "2026-08-04T10:00:00Z",
  categories: [{ id: "6187", name: "Unternehmen", parent: { id: "6189", name: "Marktplatz" } }],
  addresses: [{ street: "Markt 1", zip: "03172", city: "Guben", geoLocation: { latitude: 51.95, longitude: 14.71 } }],
  location: { name: "Guben", geoLocation: { latitude: 51.95, longitude: 14.71 } },
  contact: { email: "info@example.com", webUrls: [] },
  mediaContents: [{ sourceUrl: { url: "https://example.com/image.jpg" } }],
  webUrls: [{ url: "https://example.com", description: "Website" }],
  openingHours: [],
  operatingCompany: null,
  dataProvider: { name: "Stadt Guben" },
  ...overrides,
});

describe("SmartVillagePoiRepository", () => {
  it("keeps sanitized fixtures for all verified POI shapes", () => {
    expect(representativeSmartVillagePois).toHaveLength(10);
    expect(representativeSmartVillagePois.map((poi) => poi.name)).toEqual(expect.arrayContaining([
      "Vollstaendiger POI",
      "Minimaler POI",
      "Schule",
      "Unternehmen",
      "Museum",
      "Versteckt",
      "Fehlerhaft",
      "Ohne Koordinaten",
      "Hierarchie",
      "Doppelter Kategoriename",
    ]));
  });

  it("queries and maps public POIs while isolating hidden and malformed records", async () => {
    const warn = vi.fn();
    const request = vi.fn(async () => ({
      pointsOfInterest: [makePoi(), makePoi({ id: "2", visible: false }), makePoi({ id: null })],
    }));
    const repository = new SmartVillagePoiRepository({ client: { request } as never, publicBaseUrl: "https://example.com", warn });

    const result = await repository.getPois("de", filters);

    expect(request).toHaveBeenCalledWith(expect.stringContaining("pointsOfInterest"));
    expect(POINTS_OF_INTEREST_QUERY).toContain("openingHours");
    expect(result.results).toHaveLength(1);
    expect(result.results[0]).toMatchObject({ id: "poi:1", title: "Unternehmen A", locationValue: "guben" });
    expect(warn).toHaveBeenCalledTimes(2);
  });

  it("keeps stable facets and applies OR categories, location, radius, sorting and pagination", async () => {
    const request = vi.fn(async () => ({
      pointsOfInterest: [
        makePoi(),
        makePoi({ id: "2", name: "Schule B", description: "Lernen", categories: [{ id: "6186", name: "Schulen" }], location: null, addresses: [{ city: "Gubin", geoLocation: null }], updatedAt: "2026-08-03T10:00:00Z" }),
        makePoi({ id: "3", name: "Museum", categories: [{ id: "933", name: "Museen" }], location: { name: "Guben", geoLocation: { latitude: 60, longitude: 20 } } }),
      ],
    }));
    const repository = new SmartVillagePoiRepository({ client: { request } as never, publicBaseUrl: "https://example.com" });

    const result = await repository.getPois("de", {
      ...filters,
      categoryIds: ["6187", "6186"],
      search: "e",
      direction: "desc",
      pageSize: 1,
    });
    expect(result.totalCount).toBe(2);
    expect(result.results[0]?.title).toBe("Unternehmen A");
    expect(result.pageCount).toBe(2);
    expect(result.categories.map((entry) => entry.id)).toEqual(["933", "6186", "6187"]);
    expect(result.locations).toEqual([{ value: "guben", label: "Guben" }, { value: "gubin", label: "Gubin" }]);

    await expect(repository.getPois("de", { ...filters, location: "gubin" })).resolves.toMatchObject({ totalCount: 1 });
    await expect(repository.getPois("de", { ...filters, radius: 1 })).resolves.toMatchObject({ totalCount: 1 });
  });

  it("loads details directly with typed IDs and rejects invalid identifiers", async () => {
    const request = vi.fn(async (_query: string, variables?: Record<string, unknown>) => ({ pointOfInterest: makePoi({ id: variables?.id }) }));
    const repository = new SmartVillagePoiRepository({ client: { request } as never, publicBaseUrl: "https://example.com" });

    const result = await repository.getPoiById("de", "poi:abc%2F123");
    expect(request).toHaveBeenCalledWith(expect.stringContaining("pointOfInterest(id: $id)"), { id: "abc/123" });
    expect(POINT_OF_INTEREST_QUERY).toContain("$id: ID!");
    expect(result.poi.id).toBe("poi:abc%2F123");
    await expect(repository.getPoiById("de", "abc/123")).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("surfaces structurally invalid list and detail payloads", async () => {
    const listRepository = new SmartVillagePoiRepository({ client: { request: async () => ({ pointsOfInterest: null }) } as never, publicBaseUrl: "https://example.com" });
    await expect(listRepository.getPois("de", filters)).rejects.toMatchObject({ code: "INVALID_UPSTREAM_PAYLOAD" });

    const detailRepository = new SmartVillagePoiRepository({ client: { request: async () => ({}) } as never, publicBaseUrl: "https://example.com" });
    await expect(detailRepository.getPoiById("de", "poi:1")).rejects.toMatchObject({ code: "INVALID_UPSTREAM_PAYLOAD" });
  });
});
