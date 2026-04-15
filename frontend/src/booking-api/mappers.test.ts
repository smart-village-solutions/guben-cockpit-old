import { beforeEach, describe, expect, it } from "vitest";

import { mapBookableToBooking, mapOccupancyToAvailability } from "./mappers";

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
      bookingUrl: expect.stringContaining("tenantId=tenant-1"),
      prices: [{ price: "12,50 EUR", interval: "hour" }],
    });
    expect(booking.tickets).toHaveLength(1);
    expect(booking.tickets?.[0]).toMatchObject({
      tenantId: "tenant-1",
      title: "Smart City Buero",
      bkid: "bookable-1",
    });
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
