import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock("@/utilities/translateUtils", () => ({
  TranslatedHtml: ({ text }: { text: string }) => <div>{text}</div>,
  TranslatedText: ({ text }: { text: string }) => <span>{text}</span>,
}));

vi.mock("./BookingAvailability", () => ({
  default: ({ tenantId, bookableId }: { tenantId?: string; bookableId?: string }) => (
    <div>{`availability:${tenantId ?? "none"}:${bookableId ?? "none"}`}</div>
  ),
}));

describe("priceCard", () => {
  it("renders a non-bookable state without a checkout button for invalid booking urls", async () => {
    const { default: PriceCard } = await import("./priceCard");

    render(
      <PriceCard
        bookingUrl=""
        title="Fahrradbox"
        flags={["Wetterfest"]}
        description="Beschreibung"
      />,
    );

    expect(screen.getByText("notBookable")).toBeTruthy();
    expect(screen.queryByRole("link")).toBeNull();
    expect(screen.getByText("Beschreibung")).toBeTruthy();
    expect(screen.getByText("Wetterfest")).toBeTruthy();
  });

  it("renders price details, availability and checkout link for valid booking urls", async () => {
    const { default: PriceCard } = await import("./priceCard");

    render(
      <PriceCard
        bookingUrl="https://guben.smart-city-booking.de/admin/checkout?id=box-1"
        title="Fahrradbox"
        price="2,35 EUR"
        prices={[
          { price: "2,35 EUR", interval: "pro Tag", category: "Standard" },
          { price: "40,00 EUR", interval: "pro Monat" },
        ]}
        location="Bahnhof"
        autoCommitNote="Online bezahlen"
        tenantId="tenant-1"
        bookableId="box-1"
      />,
    );

    expect(screen.getByText("priceCard.price: 2,35 EUR (pro Tag) - Standard")).toBeTruthy();
    expect(screen.getByText("priceCard.price: 40,00 EUR (pro Monat)")).toBeTruthy();
    expect(screen.getByText("priceCard.place: Bahnhof")).toBeTruthy();
    expect(screen.getByText("Online bezahlen")).toBeTruthy();
    expect(screen.getByText("availability:tenant-1:box-1")).toBeTruthy();
    expect(screen.getByRole("link")).toHaveAttribute(
      "href",
      "https://guben.smart-city-booking.de/admin/checkout?id=box-1",
    );
  });
});
