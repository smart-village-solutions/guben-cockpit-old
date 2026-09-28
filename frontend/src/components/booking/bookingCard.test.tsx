import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Booking } from "@/stores/bookingStore";
import BookingCard from "./bookingCard";

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  useNavigate: () => vi.fn(),
}));

vi.mock("@/utilities/translateUtils", () => ({
  TranslatedHtml: ({ text }: { text: string }) => <p>{text}</p>,
}));

describe("bookingCard", () => {
  it("shows the starting price and unit in the room listing", () => {
    const booking = {
      title: "Lesesaal Bibliothek",
      type: "room",
      description: "Lesesaal",
      location: "Stadtbibliothek Guben",
      price: "ab 15,00 € pro Stunde",
    } as Booking;

    render(<BookingCard booking={booking} />);

    expect(screen.getByText("Lesesaal Bibliothek")).toBeTruthy();
    expect(screen.getByText("ab 15,00 € pro Stunde")).toBeTruthy();
  });
});
