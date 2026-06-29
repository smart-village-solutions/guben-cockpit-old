import { describe, expect, it } from "vitest";

import { trimTrailingSlashes as trimBookingTrailingSlashes } from "@/components/booking/bookingIntegration";
import { trimTrailingSlashes as trimEventTrailingSlashes } from "@/components/events/eventIntegration";
import { isValidFloatInput } from "@/components/ui/input";
import { trimTrailingSlashes } from "@/utilities/urlUtils";

describe("security hotspot helpers", () => {
  it("validates float input without regex backtracking", () => {
    expect(isValidFloatInput("10")).toBe(true);
    expect(isValidFloatInput("-10.25")).toBe(true);
    expect(isValidFloatInput("10.")).toBe(true);
    expect(isValidFloatInput(".5")).toBe(true);

    expect(isValidFloatInput("10..5")).toBe(false);
    expect(isValidFloatInput("1-0")).toBe(false);
    expect(isValidFloatInput("10a")).toBe(false);
  });

  it("trims trailing slashes from booking URLs without regex", () => {
    expect(trimBookingTrailingSlashes("/api/booking///")).toBe("/api/booking");
    expect(trimBookingTrailingSlashes("https://example.com/path/")).toBe("https://example.com/path");
    expect(trimBookingTrailingSlashes("https://example.com")).toBe("https://example.com");
  });

  it("trims trailing slashes from event URLs without regex", () => {
    expect(trimEventTrailingSlashes("/api/booking///")).toBe("/api/booking");
    expect(trimEventTrailingSlashes("https://example.com/path/")).toBe("https://example.com/path");
    expect(trimEventTrailingSlashes("https://example.com")).toBe("https://example.com");
  });

  it("trims trailing slashes in the shared URL utility", () => {
    expect(trimTrailingSlashes("/api/shared//")).toBe("/api/shared");
    expect(trimTrailingSlashes("https://example.com/")).toBe("https://example.com");
  });
});
