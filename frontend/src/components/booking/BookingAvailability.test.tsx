import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import BookingAvailability from "./BookingAvailability";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) => {
      if (key === "availability.remaining") {
        return `remaining:${options?.count}`;
      }
      if (key === "availability.capacity") {
        return `capacity:${options?.count}`;
      }
      return key;
    },
  }),
}));

vi.mock("@/booking-api/client", () => ({
  loadBookableOccupancy: vi.fn(),
}));

vi.mock("./BookingErrorState", () => ({
  BookingErrorState: ({ scope }: { scope: string }) => <div>error:{scope}</div>,
}));

describe("BookingAvailability", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders translated availability values after a successful occupancy load", async () => {
    const { loadBookableOccupancy } = await import("@/booking-api/client");
    vi.mocked(loadBookableOccupancy).mockResolvedValue({
      bookableId: "bookable-1",
      title: "Fahrradbox",
      isAvailable: true,
      totalCapacity: 8,
      booked: 2,
      remaining: 6,
    });

    render(<BookingAvailability tenantId="tenant-1" bookableId="bookable-1" />);

    await waitFor(() => {
      expect(screen.getByText("availability.label: availability.available")).toBeTruthy();
    });

    expect(screen.getByText("remaining:6")).toBeTruthy();
    expect(screen.getByText("capacity:8")).toBeTruthy();
  });

  it("renders the scoped booking error state when occupancy loading fails", async () => {
    const { loadBookableOccupancy } = await import("@/booking-api/client");
    vi.mocked(loadBookableOccupancy).mockRejectedValue(new Error("kaputt"));

    render(<BookingAvailability tenantId="tenant-1" bookableId="bookable-1" />);

    await waitFor(() => {
      expect(screen.getByText("error:availability")).toBeTruthy();
    });
  });
});
