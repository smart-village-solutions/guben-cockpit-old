import { render, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const addBookings = vi.fn();

vi.mock("@/stores/bookingStore", () => ({
  useBookingStore: (selector: (state: { addBookings: typeof addBookings }) => unknown) =>
    selector({ addBookings }),
}));

vi.mock("@/booking-api/client", () => ({
  loadPublicBookings: vi.fn(),
}));

describe("BookingIntegration", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("adds mapped bookings and completes on success", async () => {
    const { loadPublicBookings } = await import("@/booking-api/client");
    vi.mocked(loadPublicBookings).mockResolvedValue([
      {
        tenantId: "tenant-1",
        title: "Raum",
        description: "Beschreibung",
        location: "Guben",
        type: "room",
        imgUrl: "/room.jpg",
        bookingUrl:
          "https://guben.smart-city-booking.de/admin/checkout?id=bookable-1&tenant=tenant-1&amount=1",
        price: "0 EUR",
        prices: [],
        category: "room",
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

    const setLoading = vi.fn();
    const onDone = vi.fn();
    const onError = vi.fn();

    const module = await import("./bookingIntegration");
    render(
      <module.default
        tenantId="tenant-1"
        setLoading={setLoading}
        onDone={onDone}
        onError={onError}
      />,
    );

    await waitFor(() => expect(addBookings).toHaveBeenCalledTimes(1));
    expect(onDone).toHaveBeenCalledTimes(1);
    expect(onError).not.toHaveBeenCalled();
    expect(setLoading).toHaveBeenNthCalledWith(1, true);
    expect(setLoading).toHaveBeenLastCalledWith(false);
  });

  it("surfaces api failures without falling back to html", async () => {
    const { loadPublicBookings } = await import("@/booking-api/client");
    vi.mocked(loadPublicBookings).mockRejectedValue(new Error("kaputt"));

    const setLoading = vi.fn();
    const onDone = vi.fn();
    const onError = vi.fn();

    const module = await import("./bookingIntegration");
    render(
      <module.default
        tenantId="tenant-1"
        setLoading={setLoading}
        onDone={onDone}
        onError={onError}
      />,
    );

    await waitFor(() => expect(onError).toHaveBeenCalledTimes(1));
    expect(addBookings).not.toHaveBeenCalled();
    expect(onDone).not.toHaveBeenCalled();
    expect(setLoading).toHaveBeenLastCalledWith(false);
  });
});
