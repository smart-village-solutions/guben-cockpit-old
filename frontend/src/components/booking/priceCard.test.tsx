import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import PriceCard from "./priceCard";
import { mapBookableToBooking } from "@/booking-api/mappers";
import { publicBookableSchema } from "@/booking-api/schemas";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock("@/utilities/translateUtils", () => ({
  TranslatedHtml: ({ text }: { text: string }) => <div dangerouslySetInnerHTML={{ __html: text }} />,
  TranslatedText: ({ text }: { text: string }) => <span>{text}</span>,
}));

vi.mock("./BookingAvailability", () => ({
  default: ({ tenantId, bookableId }: { tenantId?: string; bookableId?: string }) => (
    <div>{`availability:${tenantId ?? "none"}:${bookableId ?? "none"}`}</div>
  ),
}));

describe("priceCard", () => {
  it("renders public JSON rental tariffs and a separate service fee with the supplied checkout link", () => {
    const booking = mapBookableToBooking(publicBookableSchema.parse({
      id: "box", tenantId: "bikes", type: "resource", title: "Fahrradbox",
      checkoutUrl: "https://booking.guben.de/checkout/box/?tenantId=bikes",
      priceCategories: [
        { priceEur: 2.35, unit: "day", external: true },
        { priceEur: 40, unit: "month", external: true },
        { priceEur: 300, unit: "year", external: true },
        { priceEur: 0.15, unit: "service-fee", external: true },
      ],
    }));
    render(<PriceCard {...booking} />);
    expect(screen.getByText("ab 2,35 € zzgl. 0,15 € Servicegebühr")).toBeTruthy();
    for (const label of ["pro Tag", "pro Monat", "pro Jahr", "Servicegebühr", "2,35 €", "40,00 €", "300,00 €", "0,15 €"]) {
      expect(screen.getByText(label)).toBeTruthy();
    }
    expect(screen.getByRole("link").getAttribute("href")).toBe(booking.bookingUrl);
  });

  it("renders a non-bookable state without a checkout button for invalid booking urls", () => {
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

  it("renders price details, availability and checkout link for valid booking urls", () => {
    const { container } = render(
      <PriceCard
        bookingUrl="https://booking.guben.de/checkout/box-1/?tenantId=bikes"
        title="Fahrradbox"
        price="ab 2,35 €"
        imgUrl="/bike-box.jpg"
        prices={[
          { price: "2,35 €", interval: "pro Tag", category: "Standard" },
          { price: "40,00 €", interval: "pro Monat" },
        ]}
        location="Bahnhof"
        autoCommitNote="Online bezahlen"
        tenantId="tenant-1"
        bookableId="box-1"
      />,
    );

    expect(screen.getByText("ab 2,35 €")).toBeTruthy();
    expect(screen.getByText("priceCard.priceInfo")).toBeTruthy();
    expect(screen.getByText("pro Tag - Standard")).toBeTruthy();
    expect(screen.getByText("2,35 €")).toBeTruthy();
    expect(screen.getByText("pro Monat")).toBeTruthy();
    expect(screen.getByText("40,00 €")).toBeTruthy();
    expect(screen.getByText("priceCard.place: Bahnhof")).toBeTruthy();
    expect(screen.getByText("Online bezahlen")).toBeTruthy();
    expect(screen.getByText("availability:tenant-1:box-1")).toBeTruthy();
    expect((screen.getByRole("link") as HTMLAnchorElement).getAttribute("href")).toBe(
      "https://booking.guben.de/checkout/box-1/?tenantId=bikes",
    );
    expect(screen.getByRole("img", { name: "Fahrradbox" }).className).toContain("object-contain");
    expect(screen.getByRole("img", { name: "Fahrradbox" }).getAttribute("loading")).toBe("lazy");
    expect(container.querySelector(".bg-\\[\\#808080\\]")).toBeTruthy();
  });

  it("renders auto commit notes as HTML instead of escaped text", () => {
    const { container } = render(
      <PriceCard
        bookingUrl="https://booking.guben.de/checkout/box-1/?tenantId=bikes"
        title="Fahrradbox"
        price="0 EUR"
        location="Schulstraße 4, 03172 Guben"
        autoCommitNote="<p><strong>Das Nutzungsentgelt wird laut der aktuellen Satzung berechnet.</strong></p>"
      />,
    );

    expect(container.querySelector("strong")?.textContent).toBe(
      "Das Nutzungsentgelt wird laut der aktuellen Satzung berechnet.",
    );
    expect(screen.queryByText(/<p><strong>/)).toBeNull();
  });
});
