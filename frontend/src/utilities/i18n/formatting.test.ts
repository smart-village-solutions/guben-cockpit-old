import { describe, expect, it } from "vitest";
import i18next from "i18next";
import deBooking from "@/assets/locales/de/booking.json";
import enBooking from "@/assets/locales/en/booking.json";
import plBooking from "@/assets/locales/pl/booking.json";
import { formatCurrency, getCurrentLocale } from "./formatting";
import { mapBookableToBooking } from "@/booking-api/mappers";
import { publicBookableSchema } from "@/booking-api/schemas";

describe("localized booking prices", () => {
  it("uses the selected language for amounts, units and generated booking notes", async () => {
    await i18next.init({ lng: "de", fallbackLng: "de", resources: { de: { booking: deBooking }, en: { booking: enBooking }, pl: { booking: plBooking } } });
    const bookable = publicBookableSchema.parse({ id: "one", tenantId: "tenant", type: "room", title: "Raum", autoCommitBooking: true, priceType: "per-hour", priceCategories: [{ priceEur: 15, unit: "hour" }] });
    for (const [language, locale, unit] of [["en", "en-GB", "per hour"], ["pl", "pl-PL", "za godzinę"], ["de", "de-DE", "pro Stunde"]]) {
      await i18next.changeLanguage(language);
      expect(getCurrentLocale()).toBe(locale);
      expect(formatCurrency(15)).toBe(new Intl.NumberFormat(locale, { style: "currency", currency: "EUR" }).format(15));
      expect(mapBookableToBooking(bookable).price).toContain(unit);
    }
  });
});
