import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { getBookingApiBaseUrl } from "./config";

describe("booking api config", () => {
  const originalApiUrl = import.meta.env.VITE_BOOKING_API_URL;

  beforeEach(() => {
    import.meta.env.VITE_BOOKING_API_URL = "https://guben-api.smart-city-booking.de";
  });

  afterEach(() => {
    import.meta.env.VITE_BOOKING_API_URL = originalApiUrl;
  });

  it("uses the configured api host", () => {
    expect(getBookingApiBaseUrl()).toBe("https://guben-api.smart-city-booking.de");
  });

  it("trims trailing slashes from the configured api host", () => {
    import.meta.env.VITE_BOOKING_API_URL = "https://guben-api.smart-city-booking.de/";
    expect(getBookingApiBaseUrl()).toBe("https://guben-api.smart-city-booking.de");
  });
});
