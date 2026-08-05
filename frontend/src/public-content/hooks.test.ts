import { describe, expect, it, vi } from "vitest";

import { loadGatewayProjectDetailContent } from "./hooks";

describe("loadGatewayProjectDetailContent", () => {
  it("loads Featured Projects from the dedicated local endpoint", async () => {
    const fetcher = vi.fn(async () => ({
      project: { id: "featured:abc%2F123", type: 1, title: "Featured", description: "Description", fullText: "Details", imageCaption: null, imageUrl: null, imageCredits: null, published: true },
      seo: { title: "Projects", description: "Projects", canonical: "https://example.com/projects", indexable: true },
    }));

    const result = await loadGatewayProjectDetailContent("de", "featured:abc%2F123", fetcher);
    expect(fetcher).toHaveBeenCalledWith("/api/content/featured-projects/featured%3Aabc%252F123", expect.anything(), { lang: "de" });
    expect(result).toMatchObject({ kind: "featured", project: { id: "featured:abc%2F123" } });
  });

  it("loads typed POI identifiers directly without scanning project pages", async () => {
    const poi = {
      id: "poi:abc%2F123",
      title: "Schule",
      description: "Beschreibung",
      imageUrl: null,
      updatedAt: null,
      categories: [{ id: "6186", name: "Schulen", parentId: null, parentName: null }],
      locationValue: "guben",
      locationLabel: "Guben",
      coordinates: null,
      media: [],
      address: null,
      contact: null,
      webUrls: [],
      openingHours: [],
      operatingCompany: null,
      dataProvider: null,
    };
    const fetcher = vi.fn(async () => ({
      poi,
      seo: { title: poi.title, description: poi.description, canonical: "https://example.com/projects/poi", indexable: true },
    }));

    const result = await loadGatewayProjectDetailContent("de", poi.id, fetcher);
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(fetcher).toHaveBeenCalledWith("/api/content/pois/poi%3Aabc%252F123", expect.anything(), { lang: "de" });
    expect(result).toMatchObject({ kind: "poi", poi: { id: poi.id } });
  });

  it("fails clearly for a missing Featured Project", async () => {
    const fetcher = vi.fn(async () => { throw new Error("not found"); });
    await expect(loadGatewayProjectDetailContent("de", "missing", fetcher)).rejects.toThrow("not found");
    expect(fetcher).toHaveBeenCalledWith("/api/content/featured-projects/missing", expect.anything(), { lang: "de" });
  });
});
