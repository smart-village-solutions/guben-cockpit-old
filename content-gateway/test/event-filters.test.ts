import { describe, expect, it } from "vitest";

import type { Event } from "../../shared/public-content/contracts.js";
import { filterEvents } from "../src/content/event-filters.js";

const makeEvent = (overrides: Partial<Event> = {}): Event => ({
  id: "event-1",
  eventId: "event-1",
  terminId: "termin-1",
  title: "Sommerfest",
  description: "Beschreibung",
  startDate: "2026-06-13T15:00:00.000Z",
  endDate: "2026-06-13T19:00:00.000Z",
  location: {
    id: "location-1",
    name: "Heilsarmee",
    city: "Guben",
    street: "Ring 55",
    telephoneNumber: null,
    fax: null,
    email: null,
    website: null,
    zip: "03172",
  },
  coordinates: {
    latitude: 51.95042,
    longitude: 14.7143,
  },
  urls: [],
  categories: [{ id: "culture", name: "Kultur" }],
  images: [],
  published: true,
  ...overrides,
});

describe("filterEvents", () => {
  it("applies title, category, date range, and distance filters together", () => {
    const matching = makeEvent({ id: "matching", title: "Sommerfest am Markt" });
    const wrongTitle = makeEvent({ id: "wrong-title", title: "Wintermarkt" });
    const wrongCategory = makeEvent({
      id: "wrong-category",
      categories: [{ id: "sports", name: "Sport" }],
    });
    const wrongDate = makeEvent({
      id: "wrong-date",
      startDate: "2026-07-13T15:00:00.000Z",
      endDate: "2026-07-13T19:00:00.000Z",
    });
    const tooFarAway = makeEvent({
      id: "too-far-away",
      coordinates: {
        latitude: 52.52,
        longitude: 13.405,
      },
    });

    expect(
      filterEvents([matching, wrongTitle, wrongCategory, wrongDate, tooFarAway], {
        pageNumber: 1,
        pageSize: 25,
        title: "sommer",
        category: "culture",
        startDate: "2026-06-01",
        endDate: "2026-06-30",
        distance: 10,
      }).map((event) => event.id),
    ).toEqual(["matching"]);
  });
});
