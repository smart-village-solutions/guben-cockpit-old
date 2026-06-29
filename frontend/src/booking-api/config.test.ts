import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { buildBookingPortalUrl, getBookingAppBaseUrl } from "./config";

describe("booking api config", () => {
  const originalApiUrl = import.meta.env.VITE_BOOKING_API_URL;

  beforeEach(() => {
    import.meta.env.VITE_BOOKING_API_URL = "https://guben-api.smart-city-booking.de";
  });

  afterEach(() => {
    import.meta.env.VITE_BOOKING_API_URL = originalApiUrl;
  });

  it("maps the api host back to the public booking host", () => {
    expect(getBookingAppBaseUrl()).toBe("https://guben.smart-city-booking.de");
  });

  it("builds checkout deep links for the public booking frontend", () => {
    expect(buildBookingPortalUrl("tenant-1", "bookable-1")).toBe(
      "https://guben.smart-city-booking.de/admin/checkout?id=bookable-1&tenant=tenant-1&amount=1",
    );
  });
});
