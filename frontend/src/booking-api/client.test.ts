import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { BookingApiError } from "./errors";
import { loadBookableOccupancy, loadPublicBookings } from "./client";

describe("booking api client", () => {
  const originalFetch = global.fetch;
  const originalApiUrl = import.meta.env.VITE_BOOKING_API_URL;

  beforeEach(() => {
    import.meta.env.VITE_BOOKING_API_URL = "https://guben-api.smart-city-booking.de";
  });

  afterEach(() => {
    vi.restoreAllMocks();
    global.fetch = originalFetch;
    import.meta.env.VITE_BOOKING_API_URL = originalApiUrl;
  });

  it("loads public bookings from the configured api url", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [
        {
          id: "bookable-1",
          tenantId: "tenant-1",
          type: "room",
          title: "Raum",
          description: "<p>Beschreibung</p>",
          imgUrl: "",
          flags: [],
          bookingNotes: "",
          autoCommitBooking: false,
          location: { display_address: "Guben" },
          priceCategories: [],
          requiresLogin: false,
          attachments: [],
          externalProviders: [],
          isBookable: true,
          isPublic: true,
          amount: null,
          minBookingDuration: null,
          maxBookingDuration: null,
          eventId: null,
        },
      ],
    } as Response);

    const result = await loadPublicBookings("tenant-1");

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/tenant-1/bookables/public"),
      expect.objectContaining({
        headers: { Accept: "application/json" },
      }),
    );
    expect(result).toHaveLength(1);
    expect(result[0]?.title).toBe("Raum");
  });

  it("filters non-public bookables from the public endpoint payload", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [
        {
          id: "bookable-public",
          tenantId: "tenant-1",
          type: "room",
          title: "Oeffentlich",
          description: "",
          imgUrl: "",
          flags: [],
          bookingNotes: "",
          autoCommitBooking: false,
          location: { display_address: "Guben" },
          priceCategories: [],
          requiresLogin: false,
          attachments: [],
          externalProviders: [],
          isBookable: true,
          isPublic: true,
          amount: null,
          minBookingDuration: null,
          maxBookingDuration: null,
          eventId: null,
        },
        {
          id: "bookable-private",
          tenantId: "tenant-1",
          type: "room",
          title: "Nicht oeffentlich",
          description: "",
          imgUrl: "",
          flags: [],
          bookingNotes: "",
          autoCommitBooking: false,
          location: { display_address: "Guben" },
          priceCategories: [],
          requiresLogin: false,
          attachments: [],
          externalProviders: [],
          isBookable: true,
          isPublic: false,
          amount: null,
          minBookingDuration: null,
          maxBookingDuration: null,
          eventId: null,
        },
      ],
    } as Response);

    const result = await loadPublicBookings("tenant-1");

    expect(result).toHaveLength(1);
    expect(result[0]?.title).toBe("Oeffentlich");
  });

  it("accepts empty attachment urls from the live api contract", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [
        {
          id: "bookable-2",
          tenantId: "tenant-1",
          type: "room",
          title: "Raum mit Anhang",
          description: "",
          imgUrl: "",
          flags: [],
          bookingNotes: "",
          autoCommitBooking: false,
          location: { display_address: "Guben" },
          priceCategories: [],
          requiresLogin: false,
          attachments: [
            {
              id: "attachment-1",
              title: "",
              caption: "",
              type: "",
              url: "",
              show: false,
              required: false,
              mailAttach: false,
            },
          ],
          externalProviders: [],
          isBookable: true,
          isPublic: true,
          amount: null,
          minBookingDuration: null,
          maxBookingDuration: null,
          eventId: null,
        },
      ],
    } as Response);

    const result = await loadPublicBookings("tenant-1");

    expect(result).toHaveLength(1);
    expect(result[0]?.attachments).toEqual([]);
  });

  it("throws a configuration error when the booking api url is missing", async () => {
    import.meta.env.VITE_BOOKING_API_URL = "";

    await expect(loadPublicBookings("tenant-1")).rejects.toMatchObject<Partial<BookingApiError>>({
      code: "BOOKING_API_CONFIG_ERROR",
      retryable: false,
    });
  });

  it("normalizes http failures", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
    } as Response);

    await expect(loadPublicBookings("tenant-1")).rejects.toMatchObject<Partial<BookingApiError>>({
      code: "BOOKING_API_HTTP_ERROR",
      status: 503,
      retryable: true,
    });
  });

  it("normalizes invalid payloads", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ nope: true }),
    } as Response);

    await expect(loadPublicBookings("tenant-1")).rejects.toMatchObject<Partial<BookingApiError>>({
      code: "BOOKING_API_INVALID_PAYLOAD",
      retryable: false,
    });
  });

  it("loads occupancy payloads", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        bookableId: "bookable-1",
        title: "Raum",
        isAvailable: true,
        totalCapacity: 1,
        booked: 0,
        remaining: 1,
      }),
    } as Response);

    const result = await loadBookableOccupancy("tenant-1", "bookable-1", {
      timeBegin: 1,
      timeEnd: 2,
    });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/tenant-1/bookables/bookable-1/occupancy?timeBegin=1&timeEnd=2"),
      expect.anything(),
    );
    expect(result.remaining).toBe(1);
  });
});
