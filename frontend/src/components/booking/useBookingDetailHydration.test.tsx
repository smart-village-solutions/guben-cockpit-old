import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useBookingStore } from "@/stores/bookingStore";
import { useBookingDetailHydration } from "./useBookingDetailHydration";

const gatewayTenantsQuery = vi.hoisted(() => ({
  data: {
    tenants: [{ id: "tenant-row-1", tenantId: "tenant-1" }],
  } as { tenants: Array<{ id: string; tenantId: string }> } | undefined,
  isLoading: false,
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
});
