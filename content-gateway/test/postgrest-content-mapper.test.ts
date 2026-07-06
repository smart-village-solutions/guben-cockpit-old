import { describe, expect, it } from "vitest";

import { buildplaceMapOverviewUrl, buildplaceMapUrl } from "../src/content/buildplace-map-urls.js";
import { PostgrestContentMapper } from "../src/content/postgrest-content-mapper.js";
import type { Config } from "../src/config.js";

const config: Config = {
  PORT: 5100,
  LOG_LEVEL: "silent",
  PUBLIC_BASE_URL: "http://localhost:3000",
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

  it("maps page, dashboard and map content with fallback translations", () => {
    const mapper = new PostgrestContentMapper(config);

    const page = mapper.pageFromRow(
      {
        id: "Projects",
        translations: {
          de: {
            Title: "Projekte",
            Description: "Alle Projekte",
          },
        },
      },
      "en",
    );
    const dashboard = mapper.dashboardFromRows("de", {
      dropdownRows: [
        {
          id: "dropdown-1",
          rank: 2,
          is_link: false,
          translations: { de: { Title: "Zweite Rubrik" } },
        },
        {
          id: "dropdown-0",
          rank: 1,
          is_link: true,
          translations: { de: { Title: "Erste Rubrik" } },
        },
      ],
      tabRows: [
        {
          id: "tab-euroregion",
          dropdown_id: "dropdown-1",
          sequence: 0,
          map_url: "https://maps.example.com/euroregion",
          translations: { de: { Title: "Euroregion" } },
        },
        {
          id: "tab-guben-gubin",
          dropdown_id: "dropdown-1",
          sequence: 1,
          map_url: "https://maps.example.com/guben-gubin",
          translations: { de: { Title: "Guben-Gubin" } },
        },
        {
          id: "tab-1",
          dropdown_id: "dropdown-1",
          sequence: 4,
          map_url: "https://maps.example.com/b",
          translations: { de: { Title: "Stadtentwicklung & Teilhabe" } },
        },
        {
          id: "tab-0",
          dropdown_id: "dropdown-1",
          sequence: 3,
          map_url: "https://maps.example.com/a",
          translations: { de: { Title: "Energie & Wirtschaft" } },
        },
        {
          id: "tab-umwelt",
          dropdown_id: "dropdown-1",
          sequence: 5,
          map_url: "https://maps.example.com/umwelt",
          translations: { de: { Title: "Gefahrenabwehr & Umwelt" } },
        },
        {
          id: "tab-kinder",
          dropdown_id: "dropdown-1",
          sequence: 6,
          map_url: "https://maps.example.com/kinder",
          translations: { de: { Title: "Kinder & Jugend" } },
        },
        {
          id: "tab-tourismus",
          dropdown_id: "dropdown-1",
          sequence: 7,
          map_url: "https://maps.example.com/tourismus",
          translations: { de: { Title: "Tourismus & Mobilität" } },
        },
        {
          id: "tab-2",
          dropdown_id: "dropdown-1",
          sequence: 8,
          map_url: "https://maps.example.com/c",
          translations: { de: { Title: "Unverändert" } },
        },
        {
          id: "orphan",
          dropdown_id: null,
          sequence: 99,
          map_url: "https://maps.example.com/orphan",
          translations: { de: { Title: "Ignoriert" } },
        },
      ],
      cardRows: [
        {
          id: "card-1",
          dashboard_tab_id: "tab-0",
          sequence: 2,
          image_url: null,
          translations: { de: { Title: "Karte 2", Description: "Beschreibung 2" } },
          button_translations: null,
          button_open_in_new_tab: null,
        },
        {
          id: "card-0",
          dashboard_tab_id: "tab-0",
          sequence: 1,
          image_url: "https://example.com/card.jpg",
          translations: {
            de: {
              Title: "Karte 1",
              Description: "Beschreibung 1",
              ImageAlt: "Alt Text",
            },
          },
          button_translations: {
            de: {
              Title: "Mehr",
              Url: "https://example.com/more",
            },
          },
          button_open_in_new_tab: true,
        },
      ],
      linkRows: [
        {
          id: "link-1",
          dropdown_id: "dropdown-0",
          link: "/a",
          sequence: 2,
          translations: { de: { Title: "Link B" } },
        },
        {
          id: "link-0",
          dropdown_id: "dropdown-0",
          link: "/b",
          sequence: 1,
          translations: { de: { Title: "Link A" } },
        },
      ],
    });
    const map = mapper.mapContent("en", undefined);

    expect(page.title).toBe("Projekte");
    expect(page.seo.canonical).toBe("http://localhost:3000/projects");
    expect(dashboard.dropdowns.map((item) => item.id)).toEqual(["dropdown-0", "dropdown-1"]);
    expect(dashboard.dropdowns[0].links.map((item) => item.title)).toEqual(["Link A", "Link B"]);
    expect(dashboard.dropdowns[1].tabs.map((item) => item.title)).toEqual([
      "Euroregion",
      "Guben-Gubin",
      "Energie & Wirtschaft",
      "Stadtentwicklung & Teilhabe",
      "Gefahrenabwehr & Umwelt",
      "Kinder & Jugend",
      "Tourismus & Mobilität",
      "Unverändert",
    ]);
    expect(dashboard.dropdowns[1].tabs.map((item) => item.mapUrl)).toEqual([
      buildplaceMapUrl("OgBlQ3t5LyqT3jiOe9n0t"),
      buildplaceMapUrl("ZM98Cpw2zk1V_ubb8N7Ex"),
      buildplaceMapUrl("YL787UBfwoBD0jsepOyTu"),
      buildplaceMapUrl("XB8lHHMfITxvf_0QGDrve"),
      buildplaceMapUrl("urVhNhQ6SlWLjS-G-jbs6"),
      buildplaceMapUrl("wlFzNKnN44qombPDU0YKc"),
      buildplaceMapUrl("DJ3cImoMtX1h-RP9nvc6v"),
      "https://maps.example.com/c",
    ]);
    expect(dashboard.dropdowns[1].tabs.find((tab) => tab.id === "tab-0")?.informationCards[0].button).toEqual({
      title: "Mehr",
      url: "https://example.com/more",
      openInNewTab: true,
    });
    expect(map.page.title).toBe("Map");
    expect(map.map.embedUrl).toBe(buildplaceMapOverviewUrl);
  });

  it("builds event detail SEO metadata", () => {
    const mapper = new PostgrestContentMapper(config);

    const detail = mapper.eventDetailFromEvent("event-1", {
      id: "event-1",
      eventId: "EV-1",
      terminId: "TER-1",
      title: "Fruehlingsmarkt",
      description: "Beschreibung",
      startDate: "2026-04-10T10:00:00.000Z",
      endDate: "2026-04-10T11:00:00.000Z",
      location: {
        id: "location-1",
        name: "Marktplatz",
        city: "Guben",
        street: null,
        telephoneNumber: null,
        fax: null,
        email: null,
        website: null,
        zip: null,
      },
      coordinates: null,
      urls: [],
      categories: [],
      images: [],
      published: true,
    });

    expect(detail.seo.canonical).toBe("http://localhost:3000/events/event-1");
    expect(detail.seo.title).toBe("Fruehlingsmarkt");
  });

  it("rejects invalid upstream event payloads deterministically", () => {
    const mapper = new PostgrestContentMapper(config);

    expect(() =>
      mapper.eventFromRow(
        {
          id: "event-1",
          event_id: "EV-1",
          termin_id: "TERM-1",
          start_date: "2026-01-01T10:00:00.000Z",
          end_date: "2026-01-01T12:00:00.000Z",
          published: true,
          deleted: false,
          location_id: "missing-location",
          coordinates: "51.95042;14.7143",
          translations: {
            de: {
              Title: "Fehlerhaftes Event",
              Description: "Beschreibung",
            },
          },
        },
        "de",
        new Map(),
        new Map(),
        new Map(),
        new Map(),
      ),
    ).toThrowError(/Missing location/);

    expect(() =>
      mapper.eventFromRow(
        {
          id: "event-2",
          event_id: "EV-2",
          termin_id: "TERM-2",
          start_date: "2026-01-01T10:00:00.000Z",
          end_date: "2026-01-01T12:00:00.000Z",
          published: true,
          deleted: false,
          location_id: "location-1",
          coordinates: "invalid",
          translations: {
            de: {
              Title: "Fehlerhaftes Event",
              Description: "Beschreibung",
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
              street: null,
              telephone_number: null,
              fax: null,
              email: null,
              website: null,
              zip: null,
              translations: {
                de: {
                  Name: "Marktplatz",
                },
              },
            },
          ],
        ]),
        new Map(),
        new Map(),
        new Map(),
      ),
    ).toThrowError(/Invalid coordinates payload/);
  });
});
