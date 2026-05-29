import { describe, expect, it } from "vitest";

import "./dateExtensions";
import { formatEventDateRange } from "./eventDateRange";

describe("formatEventDateRange", () => {
  it("renders a next-day midnight end as 23:59 without repeating the date", () => {
    const startDate = new Date(2026, 4, 30, 9, 0);
    const endDate = new Date(2026, 4, 31, 0, 0);

    expect(formatEventDateRange(startDate, endDate)).toBe("30.05.2026 09:00 - 23:59");
  });

  it("keeps the compact end-time format for same-day events", () => {
    const startDate = new Date(2026, 4, 30, 9, 0);
    const endDate = new Date(2026, 4, 30, 11, 30);

    expect(formatEventDateRange(startDate, endDate)).toBe("30.05.2026 09:00 - 11:30");
  });
});
