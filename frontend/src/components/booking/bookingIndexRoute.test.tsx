import { render, screen, waitFor } from "@testing-library/react";
import { useEffect } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const bookingState = vi.hoisted(() => ({
  bookings: [] as Array<{ category: string; title: string; description?: string; autoCommitNote?: string; flags?: string[]; tenantId?: string; bkid?: string }>,
  processedTenants: new Set<string>(),
  markProcessedTenants: vi.fn(),
  reset: vi.fn(),
}));

const bookingTenantQuery = vi.hoisted(() => ({
  data: {
    tenants: [] as Array<{ tenantId: string }>,
  },
}));

const bookingIntegrationBehavior = vi.hoisted(() => ({
  mode: "idle" as "idle" | "error",
}));

vi.mock("@tanstack/react-router", () => ({
  createLazyFileRoute: () => () => ({}),
}));

vi.mock("@/stores/bookingStore", () => ({
  useBookingStore: (selector: (state: typeof bookingState) => unknown) => selector(bookingState),
}));

vi.mock("@/public-content/hooks", () => ({
  useGatewayBookingTenants: () => bookingTenantQuery,
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock("i18next", () => ({
  default: {
    language: "de",
  },
}));

vi.mock("@/utilities/translateUtils", () => ({
  translateBatchedMultiple: vi.fn(),
  translateHtmlBatchedMultiple: vi.fn(),
}));

vi.mock("@/components/ui/Breadcrumb", () => ({
  Breadcrumb: () => <nav>breadcrumb</nav>,
}));

vi.mock("@/components/booking/bookingCard", () => ({
  default: ({ booking }: { booking: { title: string } }) => <div>{booking.title}</div>,
}));

vi.mock("@/components/booking/bookingDivider", () => ({
  default: ({ text }: { text: string }) => <div>{text}</div>,
}));

vi.mock("@/components/booking/bookingHowItWorks", () => ({
  default: () => <div>how-it-works</div>,
}));

vi.mock("@/components/booking/bookingFaq", () => ({
  default: () => <div>faq</div>,
}));

vi.mock("@/components/booking/BookingErrorState", () => ({
  BookingErrorState: ({ scope }: { scope?: string }) => <div>{`error:${scope ?? "overview"}`}</div>,
}));

vi.mock("@/components/booking/bookingIntegration", () => ({
  default: ({ onError }: { onError: (error: unknown) => void }) => {
    useEffect(() => {
      if (bookingIntegrationBehavior.mode === "error") {
        onError(new Error("kaputt"));
      }
    }, [onError]);

    return <div>integration</div>;
  },
}));

import { Booking } from "@/routes/booking/index.lazy";
import i18next from "i18next";
import { translateHtmlBatchedMultiple } from "@/utilities/translateUtils";

describe("bookingIndexRoute", () => {
  beforeEach(() => {
    i18next.language = "de";
    bookingState.bookings = [];
    bookingState.processedTenants = new Set<string>();
    bookingState.markProcessedTenants.mockReset();
    bookingState.reset.mockReset();
    bookingTenantQuery.data = {
      tenants: [{ tenantId: "tenant-1" }],
    };
    bookingIntegrationBehavior.mode = "idle";
  });

  it("renders a visible loading state while tenants are being processed", () => {
    render(<Booking />);

    expect(screen.getByText("overview.loading")).toBeTruthy();
    expect(screen.getByText("integration")).toBeTruthy();
    expect(screen.getByRole("main").getAttribute("aria-busy")).toBe("true");
  });

  it("renders the booking error state when tenant integration fails", () => {
    bookingIntegrationBehavior.mode = "error";

    render(<Booking />);

    expect(screen.getByText("error:overview")).toBeTruthy();
  });

  it("announces translation work as busy until booking descriptions finish translating", async () => {
    i18next.language = "en";
    bookingTenantQuery.data = { tenants: [] };
    bookingState.bookings = [{
      category: "room", title: "Meeting room", description: "Besprechungsraum",
      tenantId: "tenant-1", bkid: "room-1",
    }];
    let finishTranslation!: (value: string[]) => void;
    vi.mocked(translateHtmlBatchedMultiple).mockImplementationOnce(() => new Promise((resolve) => {
      finishTranslation = resolve;
    }));

    render(<Booking />);
    expect(screen.getByRole("main").getAttribute("aria-busy")).toBe("true");
    expect(translateHtmlBatchedMultiple).toHaveBeenCalledWith(["Besprechungsraum"], "en");

    finishTranslation(["Meeting room"]);
    await waitFor(() => expect(screen.getByRole("main").getAttribute("aria-busy")).toBe("false"));
    expect(screen.getByText("Meeting room")).toBeTruthy();
  });

});
