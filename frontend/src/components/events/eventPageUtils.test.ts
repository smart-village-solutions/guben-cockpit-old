import { describe, expect, it } from "vitest";

import type { BookingEvent } from "@/stores/eventStore";
import type { Event } from "@shared/public-content/contracts";

import {
  buildCombinedCategories,
  buildEventsQueryFilters,
  filterBookingEvents,
  mergeEventsWithBookingEvents,
  normalizeBookingEvent,
} from "./eventPageUtils";

const bookingEvent = (overrides: Partial<BookingEvent> = {}): BookingEvent => ({
  title: "Booking Event",
  date: "13.06.2026 15:00 - 19:00",
  organizer: "",
  contactName: "",
  contactPhone: "",
  contactEmail: "",
  teaser: "<p>Teaser</p>",
  bkid: "booking-1",
  imgUrl: "https://example.com/preview.jpg",
  flags: ["Markt"],
  details: {
    eventLocation: "Altstadt",
    street: "Markt",
    houseNumber: "1",
    zip: "03172",
    city: "Guben",
    longDescription: "<p>Langtext</p>",
    teaserImage: "https://example.com/image.jpg",
  },
  coordinates: {
    latitude: 51.95042,
    longitude: 14.7143,
  },
  ...overrides,
});

const backendEvent = (overrides: Partial<Event> = {}): Event => ({
  id: "backend-1",
  eventId: "backend-1",
  terminId: "backend-1",
  title: "Backend Event",
  description: "Beschreibung",
  startDate: "2026-06-13T10:00:00",
  endDate: "2026-06-13T12:00:00",
  location: {
    id: "loc-1",
    name: "Theater",
    city: "Guben",
    street: "Musterstrasse 1",
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

describe("eventPageUtils", () => {
  it("normalizes booking events into shared event cards", () => {
    const event = normalizeBookingEvent(bookingEvent());

    expect(event).toMatchObject({
      id: "booking-1",
      eventId: "booking:booking-1",
      terminId: "booking:booking-1",
      title: "Booking Event",
      isBookingEvent: true,
      location: {
        name: "Altstadt",
        street: "Markt 1",
      },
      categories: [{ id: "Markt", name: "Markt" }],
      images: [
        {
          previewUrl: "https://example.com/preview.jpg",
          originalUrl: "https://example.com/preview.jpg",
        },
      ],
    });
  });

  it("filters booking events by search, distance and date range", () => {
    const matching = normalizeBookingEvent(bookingEvent());
    const farAway = normalizeBookingEvent(
      bookingEvent({
        bkid: "booking-2",
        title: "Anderes Event",
        coordinates: {
          latitude: 52.52,
          longitude: 13.405,
        },
      }),
    );

    const result = filterBookingEvents([matching, farAway], {
      search: "booking",
      distance: 5,
      dateRange: {
        from: new Date("2026-06-13T00:00:00.000Z"),
        to: new Date("2026-06-13T23:59:59.000Z"),
      },
    });

    expect(result.map((event) => event.id)).toEqual(["booking-1"]);
  });

  it("keeps only in-range booking events when the backend page is full", () => {
    const backendEvents = Array.from({ length: 25 }, (_, index) =>
      backendEvent({
        id: `backend-${index + 1}`,
        eventId: `backend-${index + 1}`,
        terminId: `backend-${index + 1}`,
        startDate: `2026-06-${String(index + 1).padStart(2, "0")}T10:00:00`,
        endDate: `2026-06-${String(index + 1).padStart(2, "0")}T12:00:00`,
      }),
    );
    const inRange = normalizeBookingEvent(bookingEvent());
    const outOfRange = normalizeBookingEvent(
      bookingEvent({
        bkid: "booking-2",
        date: "01.07.2026 15:00 - 19:00",
      }),
    );

    const merged = mergeEventsWithBookingEvents(backendEvents, [inRange, outOfRange]);

    expect(merged.some((event) => event.id === "booking-1")).toBe(true);
    expect(merged.some((event) => event.id === "booking-2")).toBe(false);
  });

  it("builds query filters without undefined noise", () => {
    expect(
      buildEventsQueryFilters({
        search: "Markt",
        distance: 10,
        category: "culture",
        dateRange: {
          from: new Date("2026-06-13T00:00:00.000Z"),
          to: new Date("2026-06-14T00:00:00.000Z"),
        },
      }),
    ).toEqual({
      title: "Markt",
      distance: 10,
      category: "culture",
      startDate: "2026-06-13T00:00:00.000Z",
      endDate: "2026-06-14T00:00:00.000Z",
    });
  });

  it("merges backend and booking categories without duplicates", () => {
    const categories = buildCombinedCategories(
      [{ id: "culture", name: "Kultur" }],
      [bookingEvent(), bookingEvent({ bkid: "booking-2", flags: ["Kultur", "Sport"] })],
    );

    expect(categories).toEqual([
      { id: "culture", name: "Kultur" },
      { id: "Markt", name: "Markt" },
      { id: "Kultur", name: "Kultur" },
      { id: "Sport", name: "Sport" },
    ]);
  });
});
