import { describe, expect, it } from "vitest";

import { PostgrestContentMapper } from "../src/content/postgrest-content-mapper.js";
import type { Config } from "../src/config.js";

const config: Config = {
  PORT: 5100,
  LOG_LEVEL: "silent",
  PUBLIC_BASE_URL: "http://localhost:3000",
  MASTERPORTAL_URL: "http://masterportal",
  CONTENT_SOURCE_MODE: "mock",
  DEFAULT_LANGUAGE: "de",
  FALLBACK_LANGUAGE: "de",
};

describe("PostgrestContentMapper", () => {
  it("maps a postgrest event row into the shared contract model", () => {
    const mapper = new PostgrestContentMapper(config);

    const event = mapper.eventFromRow(
      {
        id: "event-1",
        event_id: "EV-1",
        termin_id: "TERM-1",
        start_date: "2026-01-01T10:00:00.000Z",
        end_date: "2026-01-01T12:00:00.000Z",
        published: true,
        deleted: false,
        location_id: "location-1",
        coordinates: "51.95042;14.7143",
        translations: {
          de: {
            Title: "Neujahrskonzert",
            Description: "Konzert zum Jahresauftakt",
          },
        },
      },
      "de",
      new Map([
        [
          "location-1",
          {
            id: "location-1",
            city: "Guben",
            street: "Markt 1",
            telephone_number: null,
            fax: null,
            email: null,
            website: null,
            zip: "03172",
            translations: {
              de: {
                Name: "Marktplatz",
              },
            },
          },
        ],
      ]),
      new Map([["event-1", [{ event_id: "event-1", category_id: "category-1", name: "Kultur" }]]]),
      new Map([
        [
          "event-1",
          [{ event_id: "event-1", id: 1, link: "https://example.com", description: "Mehr" }],
        ],
      ]),
      new Map([
        [
          "event-1",
          [
            {
              event_id: "event-1",
              original_url: "https://example.com/original.jpg",
              preview_url: "https://example.com/preview.jpg",
              thumbnail_url: "https://example.com/thumb.jpg",
            },
          ],
        ],
      ]),
    );

    expect(event).toMatchObject({
      id: "event-1",
      title: "Neujahrskonzert",
      location: {
        name: "Marktplatz",
      },
      categories: [{ id: "category-1", name: "Kultur" }],
      images: [
        {
          originalUrl: "https://example.com/original.jpg",
        },
      ],
    });
  });
});
