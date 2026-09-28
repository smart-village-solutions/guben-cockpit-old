import { beforeEach, describe, expect, it } from "vitest";

import { mapBookableToBooking, mapOccupancyToAvailability } from "./mappers";
import { publicBookableSchema } from "./schemas";

describe("booking api mappers", () => {
  beforeEach(() => {
    import.meta.env.VITE_BOOKING_API_URL = "https://guben-api.smart-city-booking.de";
  });

  it("maps required booking fields into the internal model contract", () => {
    const booking = mapBookableToBooking({
      id: "bookable-1",
      tenantId: "tenant-1",
      type: "room",
      title: "Smart City Buero",
      description: "<p>Beschreibung</p>",
      imgUrl: "",
      flags: ["Whiteboard"],
      bookingNotes: "",
      autoCommitBooking: true,
      location: { display_address: "Frankfurter Strasse 6, 03172 Guben" },
      priceCategories: [{ priceEur: 12.5, unit: "hour", external: false }],
      requiresLogin: false,
      attachments: [],
      externalProviders: [],
      isBookable: true,
      isPublic: true,
      amount: null,
      minBookingDuration: null,
      maxBookingDuration: null,
      eventId: null,
    });

    expect(booking).toMatchObject({
      tenantId: "tenant-1",
      title: "Smart City Buero",
      description: "<p>Beschreibung</p>",
      location: "Frankfurter Strasse 6, 03172 Guben",
      type: "room",
      category: "room",
      bkid: "bookable-1",
      bookingUrl: expect.stringContaining("/admin/checkout?id=bookable-1&tenant=tenant-1&amount=1"),
      price: "12,50 € pro Stunde",
      prices: [{ price: "12,50 €", interval: "pro Stunde" }],
    });
    expect(booking.tickets).toHaveLength(1);
    expect(booking.tickets?.[0]).toMatchObject({
      tenantId: "tenant-1",
      title: "Smart City Buero",
      bkid: "bookable-1",
    });
  });

  it("preserves Biletado hourly tiers from the parsed public payload", () => {
    const bookable = publicBookableSchema.parse({
      id: "reading-room",
      tenantId: "library",
      type: "room",
      title: "Lesesaal Bibliothek",
      priceType: "per-hour",
      priceCategories: [
        { priceEur: 15, interval: { start: "0", end: "1" }, fixedPrice: true },
        { priceEur: 30, interval: { start: "1", end: "2" }, fixedPrice: true },
        { priceEur: 45, interval: { start: "3", end: "10" }, fixedPrice: true },
      ],
    });

    const booking = mapBookableToBooking(bookable);
    expect(booking.price).toBe("ab 15,00 € pro Stunde");
    expect(booking.prices).toEqual([
      { price: "15,00 €", interval: "0 - 1 Std.", category: undefined },
      { price: "30,00 €", interval: "1 - 2 Std.", category: undefined },
      { price: "45,00 €", interval: "3 - 10 Std.", category: undefined },
    ]);
  });

  it("does not invent a duration for absent or invalid intervals", () => {
    const bookable = publicBookableSchema.parse({
      id: "bookable-3",
      tenantId: "tenant-3",
      type: "room",
      title: "Raum",
      priceType: "per-hour",
      priceCategories: [
        { priceEur: 20, interval: { start: "", end: "2" } },
        { priceEur: 30, interval: { start: "3", end: "1" } },
        { priceEur: 40, interval: { start: 1, end: 2 } },
        { priceEur: null },
      ],
    });

    expect(mapBookableToBooking(bookable).prices.map((price) => price.interval)).toEqual([
      undefined, undefined, undefined, undefined,
    ]);
  });

  it("applies deterministic safe defaults for optional fields", () => {
    const booking = mapBookableToBooking({
      id: "bookable-2",
      tenantId: "tenant-2",
      type: "resource",
      title: "Fahrradbox",
      description: "",
      imgUrl: "",
      flags: [],
      bookingNotes: "",
      autoCommitBooking: false,
      location: { display_address: "" },
      priceCategories: [],
      requiresLogin: true,
      attachments: [],
      externalProviders: [],
      isBookable: true,
      isPublic: true,
      amount: null,
      minBookingDuration: null,
      maxBookingDuration: null,
      eventId: null,
    });

    expect(booking.category).toBe("resource");
    expect(booking.flags).toEqual([]);
    expect(booking.tickets).toHaveLength(1);
    expect(booking.tickets?.[0].prices).toEqual([]);
    expect(booking.price).toBe("Auf Anfrage");
  });

  it("maps occupancy payloads into stable availability models", () => {
    expect(
      mapOccupancyToAvailability({
        bookableId: "bookable-3",
        title: "Fahrradbox",
        isAvailable: true,
        totalCapacity: null,
        booked: null,
        remaining: null,
      }),
    ).toEqual({
      bookableId: "bookable-3",
      title: "Fahrradbox",
      isAvailable: true,
      totalCapacity: null,
      booked: null,
      remaining: null,
    });
  });
});
