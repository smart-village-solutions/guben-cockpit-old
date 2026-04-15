import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useBookingStore } from "@/stores/bookingStore";
import { useBookingDetailHydration } from "./useBookingDetailHydration";

const gatewayTenantsQuery = vi.hoisted(() => ({
  data: {
    tenants: [{ id: "tenant-row-1", tenantId: "tenant-1" }],
  } as { tenants: Array<{ id: string; tenantId: string }> } | undefined,
  isLoading: false,
  error: null as unknown,
  refetch: vi.fn(),
}));

vi.mock("@/public-content/hooks", () => ({
  useGatewayBookingTenants: () => gatewayTenantsQuery,
}));

vi.mock("@/booking-api/client", () => ({
  loadPublicBookings: vi.fn(),
}));

describe("useBookingDetailHydration", () => {
  beforeEach(() => {
    useBookingStore.getState().reset();
    gatewayTenantsQuery.data = {
      tenants: [{ id: "tenant-row-1", tenantId: "tenant-1" }],
    };
    gatewayTenantsQuery.isLoading = false;
    gatewayTenantsQuery.error = null;
    gatewayTenantsQuery.refetch.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("hydrates a missing booking from the booking api for direct detail links", async () => {
    const { loadPublicBookings } = await import("@/booking-api/client");
    vi.mocked(loadPublicBookings).mockResolvedValue([
      {
        tenantId: "tenant-1",
        title: "Fahrradbox Laternengasse",
        description: "Beschreibung",
        location: "Guben",
        type: "resource",
        imgUrl: "/bike-box.jpg",
        bookingUrl:
          "https://guben.smart-city-booking.de/admin/checkout?id=bookable-1&tenant=tenant-1&amount=1",
        price: "2,35 EUR",
        prices: [],
        category: "resource",
        flags: [],
        bkid: "bookable-1",
        autoCommitNote: "",
        tickets: [],
        bookings: [],
        requiresLogin: false,
        isBookable: true,
        attachments: [],
      },
    ]);

    const { result } = renderHook(() => useBookingDetailHydration("Fahrradbox Laternengasse"));

    await waitFor(() => {
      expect(result.current.booking?.title).toBe("Fahrradbox Laternengasse");
    });

    expect(loadPublicBookings).toHaveBeenCalledWith("tenant-1");
    expect(useBookingStore.getState().processedTenants.has("tenant-1")).toBe(true);
    expect(result.current.hydrationError).toBeNull();
  });

  it("surfaces hydration failures and retries them on demand", async () => {
    const { loadPublicBookings } = await import("@/booking-api/client");
    vi.mocked(loadPublicBookings)
      .mockRejectedValueOnce(new Error("kaputt"))
      .mockResolvedValueOnce([
        {
          tenantId: "tenant-1",
          title: "Fahrradbox Laternengasse",
          description: "Beschreibung",
          location: "Guben",
          type: "resource",
          imgUrl: "/bike-box.jpg",
          bookingUrl:
            "https://guben.smart-city-booking.de/admin/checkout?id=bookable-1&tenant=tenant-1&amount=1",
          price: "2,35 EUR",
          prices: [],
          category: "resource",
          flags: [],
          bkid: "bookable-1",
          autoCommitNote: "",
          tickets: [],
          bookings: [],
          requiresLogin: false,
          isBookable: true,
          attachments: [],
        },
      ]);

    const { result } = renderHook(() => useBookingDetailHydration("Fahrradbox Laternengasse"));

    await waitFor(() => {
      expect(result.current.hydrationError).toBeInstanceOf(Error);
    });

    result.current.retry();

    await waitFor(() => {
      expect(result.current.booking?.title).toBe("Fahrradbox Laternengasse");
    });

    expect(loadPublicBookings).toHaveBeenCalledTimes(2);
    expect(result.current.hydrationError).toBeNull();
  });

  it("hydrates tenants sequentially and keeps partial successes before finding the target booking", async () => {
    const { loadPublicBookings } = await import("@/booking-api/client");
    vi.mocked(loadPublicBookings)
      .mockResolvedValueOnce([
        {
          tenantId: "tenant-1",
          title: "Anderes Objekt",
          description: "",
          location: "Guben",
          type: "room",
          imgUrl: "/other.jpg",
          bookingUrl:
            "https://guben.smart-city-booking.de/admin/checkout?id=other&tenant=tenant-1&amount=1",
          price: "0 EUR",
          prices: [],
          category: "room",
          flags: [],
          bkid: "other",
          autoCommitNote: "",
          tickets: [],
          bookings: [],
          requiresLogin: false,
          isBookable: true,
          attachments: [],
        },
      ])
      .mockResolvedValueOnce([
        {
          tenantId: "tenant-2",
          title: "Fahrradbox Laternengasse",
          description: "Beschreibung",
          location: "Guben",
          type: "resource",
          imgUrl: "/bike-box.jpg",
          bookingUrl:
            "https://guben.smart-city-booking.de/admin/checkout?id=bookable-1&tenant=tenant-2&amount=1",
          price: "2,35 EUR",
          prices: [],
          category: "resource",
          flags: [],
          bkid: "bookable-1",
          autoCommitNote: "",
          tickets: [],
          bookings: [],
          requiresLogin: false,
          isBookable: true,
          attachments: [],
        },
      ]);
    gatewayTenantsQuery.data = {
      tenants: [
        { id: "tenant-row-1", tenantId: "tenant-1" },
        { id: "tenant-row-2", tenantId: "tenant-2" },
      ],
    };

    const { result } = renderHook(() => useBookingDetailHydration("Fahrradbox Laternengasse"));

    await waitFor(() => {
      expect(useBookingStore.getState().bookings.map((booking) => booking.title)).toEqual([
        "Anderes Objekt",
        "Fahrradbox Laternengasse",
      ]);
    });

    expect(loadPublicBookings).toHaveBeenNthCalledWith(1, "tenant-1");
    expect(loadPublicBookings).toHaveBeenNthCalledWith(2, "tenant-2");
    expect(result.current.hydrationError).toBeNull();
  });

  it("surfaces gateway tenant query errors and retries the query", async () => {
    gatewayTenantsQuery.data = undefined;
    gatewayTenantsQuery.error = new Error("gateway kaputt");

    const { result } = renderHook(() => useBookingDetailHydration("Fahrradbox Laternengasse"));

    await waitFor(() => {
      expect(result.current.hydrationError).toBeInstanceOf(Error);
    });

    result.current.retry();

    expect(gatewayTenantsQuery.refetch).toHaveBeenCalledTimes(1);
  });
});
