import { describe, expect, it } from "vitest";

import {
  bookingFaqsContentSchema,
  eventDetailContentSchema,
  eventsContentSchema,
  gatewayErrorSchema,
  homeContentSchema,
  projectsContentSchema,
  publicContentBundleSchema,
} from "./contracts.js";

describe("public content contracts", () => {
  it("accepts normalized Booking FAQs and rejects invalid fields", () => {
    const payload = {
      items: [{ id: "faq-1", question: "Frage", answer: "Antwort", languageCode: "de", sortWeight: 2 }],
    };

    expect(bookingFaqsContentSchema.parse(payload)).toEqual(payload);
    expect(() => bookingFaqsContentSchema.parse({ items: [{ ...payload.items[0], id: undefined }] })).toThrowError();
    expect(() => bookingFaqsContentSchema.parse({ items: [{ ...payload.items[0], sortWeight: "2" }] })).toThrowError();
  });

  it("accepts valid home content payloads", () => {
    const payload = {
      page: {
        id: "home",
        title: "Startseite",
        description: "Willkommen",
        seo: {
          title: "Startseite",
          description: "Willkommen in Guben",
          canonical: "https://example.com/",
          indexable: true,
        },
      },
      dashboard: {
        dropdowns: [],
      },
      seo: {
        title: "Startseite",
        description: "Willkommen in Guben",
        canonical: "https://example.com/",
        indexable: true,
      },
    };

    expect(homeContentSchema.parse(payload)).toEqual(payload);
  });

  it("rejects invalid projects content payloads with missing required fields", () => {
    expect(() =>
      projectsContentSchema.parse({
        page: {
          id: "projects",
          title: "Projekte",
          description: "Alle Projekte",
          seo: {
            title: "Projekte",
            description: "Alle Projekte",
            canonical: "https://example.com/projects",
            indexable: true,
          },
        },
        featuredProjects: [],
        schools: [],
        businesses: {
          pageNumber: 1,
          pageSize: 10,
          totalCount: 0,
          pageCount: 0,
          results: [
            {
              id: "project-1",
              type: 1,
              title: "Projekt 1",
            },
          ],
        },
        seo: {
          title: "Projekte",
          description: "Alle Projekte",
          canonical: "https://example.com/projects",
          indexable: true,
        },
      }),
    ).toThrowError();
  });

  it("accepts valid events and event detail payloads", () => {
    const event = {
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
        street: "Markt 1",
        telephoneNumber: null,
        fax: null,
        email: null,
        website: null,
        zip: "03172",
      },
      coordinates: {
        latitude: 51.95,
        longitude: 14.71,
      },
      urls: [
        {
          link: "https://example.com",
          description: "Details",
        },
      ],
      categories: [
        {
          id: "culture",
          name: "Kultur",
        },
      ],
      images: [
        {
          thumbnailUrl: "https://example.com/thumb.jpg",
          previewUrl: "https://example.com/preview.jpg",
          originalUrl: "https://example.com/original.jpg",
        },
      ],
      published: true,
    };

    expect(
      eventsContentSchema.parse({
        page: {
          id: "events",
          title: "Events",
          description: "Alle Events",
          seo: {
            title: "Events",
            description: "Alle Events",
            canonical: "https://example.com/events",
            indexable: true,
          },
        },
        events: {
          pageNumber: 1,
          pageSize: 10,
          totalCount: 1,
          pageCount: 1,
          results: [event],
          categories: [{ id: "culture", name: "Kultur" }],
          bookingTenants: [{ id: "tenant-1", tenantId: "tenant-public" }],
        },
        seo: {
          title: "Events",
          description: "Alle Events",
          canonical: "https://example.com/events",
          indexable: true,
        },
      }).events.results[0],
    ).toEqual(event);

    expect(
      eventDetailContentSchema.parse({
        event,
        seo: {
          title: "Fruehlingsmarkt",
          description: "Beschreibung",
          canonical: "https://example.com/events/event-1",
          indexable: true,
        },
      }).event.id,
    ).toBe("event-1");
  });

  it("accepts a valid bundled public content payload", () => {
    const payload = {
      home: {
        page: {
          id: "Home",
          title: "Startseite",
          description: "Willkommen",
          seo: {
            title: "Startseite",
            description: "Willkommen",
            canonical: "https://example.com/",
            indexable: true,
          },
        },
        dropdowns: [],
        cards: [
          {
            id: "card-1",
            dropdownId: "dropdown-1",
            dropdownTitle: "Leben",
            tabId: "tab-1",
            tabTitle: "Mobilitaet",
            sequence: 1,
            title: "Bus und Bahn",
            description: "Alles zur Mobilitaet",
            imageUrl: null,
            imageAlt: null,
            button: {
              title: "Mehr",
              url: "https://example.com/mobilitaet",
              openInNewTab: true,
            },
          },
        ],
      },
      projects: {
        page: {
          id: "Projects",
          title: "Mein Guben",
          description: "Alle Inhalte",
          seo: {
            title: "Mein Guben",
            description: "Alle Inhalte",
            canonical: "https://example.com/projects",
            indexable: true,
          },
        },
        items: [
          {
            id: "project-1",
            category: "featured",
            type: 1,
            title: "Innenstadt beleben",
            description: "Kurztext",
            fullText: "Langtext",
            imageCaption: null,
            imageUrl: null,
            imageCredits: null,
            published: true,
          },
        ],
      },
    };

    expect(publicContentBundleSchema.parse(payload)).toEqual(payload);
  });

  it("keeps the standardized gateway error contract stable for PostgREST and Smart Village upstreams", () => {
    const payload = {
      error: {
        code: "UPSTREAM_TIMEOUT",
        message: "postgrest request timed out",
        upstream: "postgrest",
        retryable: true,
        requestId: "req-1",
      },
    };

    expect(gatewayErrorSchema.parse(payload)).toEqual(payload);
    expect(
      gatewayErrorSchema.parse({
        error: {
          ...payload.error,
          message: "smartvillage request timed out",
          upstream: "smartvillage",
        },
      }),
    ).toEqual({
      error: {
        ...payload.error,
        message: "smartvillage request timed out",
        upstream: "smartvillage",
      },
    });
    expect(() =>
      gatewayErrorSchema.parse({
        error: {
          ...payload.error,
          code: "UNKNOWN_ERROR",
        },
      }),
    ).toThrowError();
  });
});
