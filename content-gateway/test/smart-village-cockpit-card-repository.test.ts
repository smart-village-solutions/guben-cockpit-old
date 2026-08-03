import { describe, expect, it, vi } from "vitest";

import { SmartVillageCockpitCardRepository } from "../src/content/smart-village-cockpit-card-repository.js";

const item = (overrides: Record<string, unknown> = {}) => ({
  id: "card-1",
  title: "Kachel",
  genericType: "COCKPIT_CARD",
  payload: { languageCode: "de", sortWeight: 2, openInNewTab: true },
  contentBlocks: [{ body: "Beschreibung" }],
  mediaContents: [{ sourceUrl: { url: "https://example.com/image.jpg", description: "Bildtext" } }],
  webUrls: [{ url: "https://example.com", description: "Mehr lesen" }],
  categories: [{ name: " Energie & Wirtschaft " }],
  ...overrides,
});

describe("SmartVillageCockpitCardRepository", () => {
  it("queries COCKPIT_CARD fields, filters language, maps optional content, and sorts ascending", async () => {
    const request = vi.fn(async () => ({
      genericItems: [
        item({ id: "later", payload: { languageCode: "DE", sortWeight: 5, openInNewTab: true } }),
        item({ id: "english", payload: { languageCode: "en", sortWeight: 0 } }),
        item({
          id: "first",
          payload: { languageCode: "de", sortWeight: 0 },
          contentBlocks: [],
          mediaContents: [],
          webUrls: [],
        }),
      ],
    }));
    const repository = new SmartVillageCockpitCardRepository({ client: { request: request as never } });

    await expect(repository.getCockpitCards("de-DE")).resolves.toEqual([
      {
        categoryName: "Energie & Wirtschaft",
        languageCode: "de",
        sortWeight: 0,
        card: {
          id: "first",
          title: "Kachel",
          description: null,
          imageUrl: null,
          imageAlt: null,
          button: null,
        },
      },
      expect.objectContaining({
        sortWeight: 5,
        card: expect.objectContaining({
          id: "later",
          description: "Beschreibung",
          imageUrl: "https://example.com/image.jpg",
          imageAlt: "Bildtext",
          button: {
            title: "Mehr lesen",
            url: "https://example.com",
            openInNewTab: true,
          },
        }),
      }),
    ]);
    expect(request).toHaveBeenCalledWith(expect.stringContaining('genericItems(genericType: "COCKPIT_CARD")'));
    const query = (request.mock.calls as unknown as Array<[string]>)[0]?.[0];
    expect(query).toContain("webUrls { url description }");
    expect(query).toContain("categories { name }");
  });

  it("isolates malformed items and applies safe payload and button defaults", async () => {
    const warn = vi.fn();
    const repository = new SmartVillageCockpitCardRepository({
      client: {
        request: async () => ({
          genericItems: [
            item({ id: "missing-category", categories: [] }),
            item({
              id: "defaults",
              payload: { languageCode: "de", sortWeight: "invalid" },
              webUrls: [{ url: "https://example.com", description: "" }],
            }),
          ],
        }),
      } as never,
      warn,
    });

    const result = await repository.getCockpitCards("de");

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      sortWeight: 0,
      card: { id: "defaults", button: { title: "Mehr erfahren", openInNewTab: false } },
    });
    expect(warn).toHaveBeenCalledWith("Skipping malformed Smart Village Cockpit Card", {
      itemId: "missing-category",
    });
  });

  it("rejects an invalid top-level collection", async () => {
    const repository = new SmartVillageCockpitCardRepository({
      client: { request: async () => ({ genericItems: null }) } as never,
    });

    await expect(repository.getCockpitCards("de")).rejects.toMatchObject({
      code: "INVALID_UPSTREAM_PAYLOAD",
      upstream: "smartvillage",
    });
  });
});
