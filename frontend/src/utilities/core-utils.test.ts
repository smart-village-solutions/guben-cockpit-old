import { describe, expect, it, vi } from "vitest";

import { getContrast, getHexColorFromText, getLuminance, hexToRgb, rgbToHex } from "./colorUtils";
import "./dateExtensions";
import { getEnumKeyByEnumValue, tryGetEnumValue } from "./enumUtils";
import { FetchInterceptor } from "./fetchApiExtensions";
import { isNullOrUndefined, isNullOrUndefinedOrEmpty, isNullOrUndefinedOrWhiteSpace } from "./nullabilityUtils";

enum NumericEnum {
  Zero,
  One,
}

const StringEnum = {
  De: "de",
  En: "en",
} as const;

describe("utility modules", () => {
  it("handles color conversions and contrast calculations", () => {
    expect(hexToRgb("#ff8800")).toEqual([255, 136, 0]);
    expect(hexToRgb("invalid")).toBeNull();
    expect(rgbToHex([255, 136, 0])).toBe("#ff880");
    expect(getLuminance([255, 255, 255])).toBeGreaterThan(getLuminance([0, 0, 0]));
    expect(getContrast([255, 255, 255], [0, 0, 0])).toBeGreaterThan(20);
    expect(getHexColorFromText("Guben")).toMatch(/^#[0-9a-f]{6}$/);
  });

  it("extends Date with formatting and arithmetic helpers", () => {
    const localDate = new Date(2026, 3, 10, 10, 15, 30);
    const utcDate = new Date("2026-04-10T10:15:30.000Z");

    expect(localDate.toIsoDate()).toBe("2026-04-10");
    expect(utcDate.toIsoTimestamp()).toBe("2026-04-10T10:15:30.000Z");
    expect(localDate.toIsoTimeOnly()).toMatch(/10:15:30/);
    expect(localDate.formatDate()).toBe("10.04.2026");
    expect(localDate.formatDateTime()).toBe("10.04.2026 10:15");
    expect(localDate.formatDateTime(true)).toBe("10.04.2026 10:15:30");
    expect(localDate.formatTime()).toBe("10:15");
    expect(localDate.formatTime(true)).toBe("10:15:30");

    expect(new Date(2026, 3, 10, 10, 15, 30).addMinutes(30).getMinutes()).toBe(45);
    expect(new Date(2026, 3, 10, 10, 15, 30).addHours(2).getHours()).toBe(12);
    expect(new Date(2026, 3, 10, 10, 15, 30).addDays(2).getDate()).toBe(12);
    expect(new Date(2026, 3, 10, 10, 15, 30).addWeeks(1).getDate()).toBe(17);
    expect(new Date(2026, 3, 10, 10, 15, 30).addMonths(1).getMonth()).toBe(4);
    expect(new Date(2026, 3, 10, 10, 15, 30).addYears(1).getFullYear()).toBe(2027);
    expect(new Date(2026, 3, 10, 10, 15, 30).differenceInDays(new Date(2026, 3, 12, 10, 15, 30))).toBe(2);

    const weekStart = new Date(2026, 3, 10, 10, 15, 30).startOfWeek();
    expect(weekStart.getDay()).toBe(1);
    expect(weekStart.getHours()).toBe(0);

    const weekEnd = new Date(2026, 3, 10, 10, 15, 30).endOfWeek();
    expect(weekEnd.getDay()).toBe(0);
    expect(weekEnd.getHours()).toBe(23);

    expect(new Date(2026, 3, 10, 10, 15, 30).startOfMonth().getDate()).toBe(1);
    expect(new Date(2026, 3, 10, 10, 15, 30).endOfMonth().getDate()).toBe(30);
  });

  it("resolves enums, nullability and fetch headers correctly", async () => {
    expect(getEnumKeyByEnumValue(StringEnum, "en")).toBe("En");
    expect(getEnumKeyByEnumValue(StringEnum, "fr")).toBeNull();

    expect(tryGetEnumValue("en", StringEnum)).toBe("en");
    expect(tryGetEnumValue("1", NumericEnum)).toBe(1);
    expect(tryGetEnumValue("missing", StringEnum, "de")).toBe("de");
    expect(tryGetEnumValue(null, NumericEnum)).toBe(0);
    expect(tryGetEnumValue(undefined, StringEnum)).toBe("de");

    expect(isNullOrUndefined(null)).toBe(true);
    expect(isNullOrUndefined(undefined)).toBe(true);
    expect(isNullOrUndefined(0)).toBe(false);
    expect(isNullOrUndefinedOrEmpty([])).toBe(true);
    expect(isNullOrUndefinedOrEmpty(["x"])).toBe(false);
    expect(isNullOrUndefinedOrWhiteSpace("   ")).toBe(true);
    expect(isNullOrUndefinedOrWhiteSpace("Guben")).toBe(false);

    const originalFetch = window.fetch;
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ ok: true })));
    window.fetch = fetchMock as typeof window.fetch;

    FetchInterceptor.setHeader("Accept-Language", "de");
    expect(FetchInterceptor.hasHeader("Accept-Language")).toBe(true);
    FetchInterceptor.register();
    await window.fetch("/api/test", {
      headers: {
        Authorization: "Bearer token",
      },
    });
    FetchInterceptor.removeHeader("Accept-Language");

    expect(fetchMock).toHaveBeenCalledWith("/api/test", {
      headers: {
        Authorization: "Bearer token",
        "Accept-Language": "de",
      },
    });
    expect(FetchInterceptor.hasHeader("Accept-Language")).toBe(false);

    window.fetch = originalFetch;
  });
});
