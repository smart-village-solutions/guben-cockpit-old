import type { ReactNode } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import BookingRoom from "./bookingRoom";

const navigateMock = vi.fn();

const hydrationState = vi.hoisted(() => ({
  booking: null as Record<string, unknown> | null,
  isHydrating: false,
  hydrationError: null as unknown,
  retry: vi.fn(),
}));

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => navigateMock,
  useParams: () => ({ title: "Rathaus" }),
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

vi.mock("./bookingDivider", () => ({
  default: ({ text }: { text: string }) => <div>{text}</div>,
}));

vi.mock("./bookingCard", () => ({
  default: ({ booking }: { booking: { title: string } }) => <div>{`room-card:${booking.title}`}</div>,
}));

vi.mock("../ui/DetailPageLayout", () => ({
  DetailPageLayout: ({
    title,
    children,
    onBack,
    backLabel,
  }: {
    title: ReactNode;
    children: ReactNode;
    onBack?: () => void;
    backLabel?: string;
  }) => (
    <div>
      <h1>{title}</h1>
      <button onClick={onBack}>{backLabel}</button>
      <div>{children}</div>
    </div>
  ),
}));

vi.mock("@/utilities/translateUtils", () => ({
  TranslatedHtml: ({ text }: { text: string }) => <div>{text}</div>,
}));

describe("bookingRoom", () => {
  beforeEach(() => {
    hydrationState.booking = null;
    hydrationState.isHydrating = false;
    hydrationState.hydrationError = null;
    hydrationState.retry.mockReset();
    navigateMock.mockReset();
  });

  it("renders loading while room details hydrate", async () => {
    hydrationState.isHydrating = true;
    render(<BookingRoom />);

    expect(screen.getByText("bookingComponent.loading")).toBeTruthy();
  });

  it("renders error state when hydration fails", async () => {
    hydrationState.hydrationError = new Error("kaputt");
    render(<BookingRoom />);

    expect(screen.getByText("error:detail")).toBeTruthy();
  });

  it("renders not found when the hydrated room booking is missing", async () => {
    render(<BookingRoom />);

    expect(screen.getByText("bookingComponent.notFound")).toBeTruthy();
  });

  it("renders room cards and supports navigation back to the overview", () => {
    hydrationState.booking = {
      title: "Rathaus",
      description: "Raumbeschreibung",
      imgUrl: "/rooms.jpg",
      bookings: [{ title: "Saal 1" }, { title: "Saal 2" }],
    };

    render(<BookingRoom />);

    expect(screen.getByText("Raumbeschreibung")).toBeTruthy();
    expect(screen.getByText("our_rooms")).toBeTruthy();
    expect(screen.getByText("room-card:Saal 1")).toBeTruthy();
    expect(screen.getByText("room-card:Saal 2")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "AllBookings" }));
    expect(navigateMock).toHaveBeenCalledWith({ to: "/booking" });
  }, 10000);
});
