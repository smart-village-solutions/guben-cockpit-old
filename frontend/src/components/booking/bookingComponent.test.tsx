import type { ReactNode } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import BookingComponent from "./bookingComponent";

const navigateMock = vi.fn();

const hydrationState = vi.hoisted(() => ({
  booking: null as Record<string, unknown> | null,
  isHydrating: false,
  hydrationError: null as unknown,
  retry: vi.fn(),
}));

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => navigateMock,
  useParams: () => ({ title: "Fahrradbox Laternengasse" }),
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock("./useBookingDetailHydration", () => ({
  useBookingDetailHydration: () => hydrationState,
}));

vi.mock("./BookingErrorState", () => ({
  BookingErrorState: ({ scope }: { scope: string }) => <div>error:{scope}</div>,
}));

vi.mock("./priceCard", () => ({
  default: ({ title, tenantId, bookableId }: { title: string; tenantId?: string; bookableId?: string }) => (
    <div>{`price-card:${title}:${tenantId ?? "none"}:${bookableId ?? "none"}`}</div>
  ),
}));

vi.mock("../ui/DetailPageLayout", () => ({
  DetailPageLayout: ({
    title,
    metadata,
    children,
    heroImage,
    onBack,
    backLabel,
  }: {
    title: ReactNode;
    metadata: ReactNode;
    children: ReactNode;
    heroImage?: string;
    onBack?: () => void;
    backLabel?: string;
  }) => (
    <div>
      <h1>{title}</h1>
      {heroImage ? <img data-testid="detail-header-image" alt="" src={heroImage} /> : null}
      <button onClick={onBack}>{backLabel}</button>
      <div>{metadata}</div>
      <div>{children}</div>
    </div>
  ),
}));

vi.mock("@/utilities/translateUtils", () => ({
  TranslatedHtml: ({ text }: { text: string }) => <div>{text}</div>,
}));

describe("bookingComponent", () => {
  beforeEach(() => {
    hydrationState.booking = null;
    hydrationState.isHydrating = false;
    hydrationState.hydrationError = null;
    hydrationState.retry.mockReset();
    navigateMock.mockReset();
  });

  it("renders a loading state while hydration is running", async () => {
    hydrationState.isHydrating = true;
    render(<BookingComponent />);

    expect(screen.getByText("bookingComponent.loading")).toBeTruthy();
  });

  it("renders the scoped booking error state when hydration fails before data is available", async () => {
    hydrationState.hydrationError = new Error("kaputt");
    render(<BookingComponent />);

    expect(screen.getByText("error:detail")).toBeTruthy();
  });

  it("renders not found when no hydrated booking exists", async () => {
    render(<BookingComponent />);

    expect(screen.getByText("bookingComponent.notFound")).toBeTruthy();
  });

  it("renders metadata, description and the fallback price card for direct bookings", () => {
    hydrationState.booking = {
      tenantId: "tenant-1",
      title: "Fahrradbox Laternengasse",
      description: "Beschreibung",
      location: "Guben",
      category: "resource",
      flags: ["24/7"],
      imgUrl: "/bike-box.jpg",
      bookingUrl: "https://example.com/checkout",
      price: "2,35 EUR",
      prices: [],
      autoCommitNote: "sofort",
      bkid: "box-1",
      tickets: [],
    };

    render(<BookingComponent />);

    expect(screen.getByText("bookingComponent.description")).toBeTruthy();
    expect(screen.getByText("Beschreibung")).toBeTruthy();
    expect(screen.getByText("Ressource")).toBeTruthy();
    expect(screen.getByText("Ort")).toBeTruthy();
    expect(screen.getByText("Guben")).toBeTruthy();
    expect(screen.getByRole("img", { name: "Fahrradbox Laternengasse" })).toBeTruthy();
    expect(screen.queryByTestId("detail-header-image")).toBeNull();
    expect(screen.getByText("price-card:Fahrradbox Laternengasse:tenant-1:box-1")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "AllBookings" }));
    expect(navigateMock).toHaveBeenCalledWith({ to: "/booking" });
  });

  it("renders one price card per ticket when ticket offers exist", () => {
    hydrationState.booking = {
      tenantId: "tenant-1",
      title: "Großes Angebot",
      description: "Beschreibung",
      location: "Guben",
      category: "room",
      flags: [],
      imgUrl: "/room.jpg",
      bookingUrl: "https://example.com/checkout",
      price: "10 EUR",
      prices: [],
      bkid: "parent",
      tickets: [
        {
          tenantId: "tenant-1",
          title: "Ticket A",
          description: "",
          location: "Guben",
          type: "ticket",
          prices: [],
          bookingUrl: "https://example.com/ticket-a",
          bkid: "ticket-a",
          imgUrl: "/ticket-a.jpg",
        },
        {
          tenantId: "tenant-2",
          title: "Ticket B",
          description: "",
          location: "Berlin",
          type: "ticket",
          prices: [],
          bookingUrl: "https://example.com/ticket-b",
          bkid: "ticket-b",
          imgUrl: "/ticket-b.jpg",
        },
      ],
    };

    render(<BookingComponent />);

    expect(screen.getByText("price-card:Ticket A:tenant-1:ticket-a")).toBeTruthy();
    expect(screen.getByText("price-card:Ticket B:tenant-2:ticket-b")).toBeTruthy();
  });
});
