import { describe, expect, it, vi } from "vitest";

import { PostgrestClient } from "../src/upstream/postgrest-client.js";
import { PostgrestContentSource } from "../src/content/postgrest-content-source.js";

describe("PostgrestContentSource", () => {
  it("loads event detail through direct filtered queries", async () => {
    const select = vi.fn(async (resource: string, params: Record<string, string>) => {
      switch (resource) {
        case "events":
          expect(params.id).toBe("eq.event-1");
          return [
            {
              id: "event-1",
              event_id: "EV-1",
              termin_id: "TERM-1",
              start_date: "2026-01-01T10:00:00.000Z",
              end_date: "2026-01-01T12:00:00.000Z",
              published: true,
              deleted: false,
              location_id: "location-1",
              coordinates: "51.9;14.7",
              translations: { de: { Title: "Event", Description: "Beschreibung" } },
            },
          ];
        case "locations":
          expect(params.id).toBe("eq.location-1");
          return [
            {
              id: "location-1",
              city: "Guben",
              street: "Markt 1",
              telephone_number: null,
              fax: null,
              email: null,
              website: null,
              zip: "03172",
              translations: { de: { Name: "Marktplatz" } },
            },
          ];
        case "event_categories":
          expect(params.event_id).toBe("eq.event-1");
          return [{ event_id: "event-1", category_id: "category-1", name: "Kultur" }];
        case "event_urls":
          expect(params.event_id).toBe("eq.event-1");
          return [{ event_id: "event-1", id: 1, link: "https://example.com", description: "Mehr" }];
        case "event_images":
          expect(params.event_id).toBe("eq.event-1");
          return [
            {
              event_id: "event-1",
              original_url: "https://example.com/original.jpg",
              preview_url: "https://example.com/preview.jpg",
              thumbnail_url: "https://example.com/thumb.jpg",
            },
          ];
        default:
          throw new Error(`unexpected resource ${resource}`);
      }
    });

    const source = new PostgrestContentSource({ select } as unknown as PostgrestClient);
    const bundle = await source.getEventDetailBundle("event-1");

    expect(bundle?.eventRow.id).toBe("event-1");
    expect(select).toHaveBeenCalledTimes(5);
    expect(select).not.toHaveBeenCalledWith("booking_tenants", expect.anything());
  });
});
