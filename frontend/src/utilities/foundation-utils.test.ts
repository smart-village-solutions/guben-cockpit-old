import { describe, expect, it } from "vitest";
import { getHexColorFromText } from "./colorUtils";
import { TimeRegex, TimeWithSecondsRegex } from "./constants";
import { isNullOrUndefinedOrWhiteSpace } from "./nullabilityUtils";
import { getEventImage } from "../lib/DefaultEventImage";

describe("foundation utility compatibility", () => {
  it.each([
    ["", "#000000"], ["Guben", "#bd301f"], ["ÄÖüß", "#755b5c"],
    ["😀", "#630d1b"], ["A😀B", "#5e2b64"], ["\uD83D", "#3dd800"],
  ])("preserves the existing text color for %j", (text, color) => {
    expect(getHexColorFromText(text)).toBe(color);
  });

  it("retains accepted time boundaries and rejects malformed or non-ASCII times", () => {
    for (const time of ["0:00", "09:59", "19:30", "24:59"]) {
      expect(TimeRegex.test(time)).toBe(true);
      expect(TimeWithSecondsRegex.test(`${time}:59`)).toBe(true);
    }
    for (const time of ["25:00", "12:60", "00:0", "１２:３０", "12:30extra"]) {
      expect(TimeRegex.test(time)).toBe(false);
      expect(TimeWithSecondsRegex.test(`${time}:00`)).toBe(false);
    }
  });

  it("handles absent text and normalizes every sharp s in a category", () => {
    expect(isNullOrUndefinedOrWhiteSpace(null)).toBe(true);
    expect(isNullOrUndefinedOrWhiteSpace(undefined)).toBe(true);
    expect(isNullOrUndefinedOrWhiteSpace("\t\n")).toBe(true);
    expect(getEventImage("Straße / Spaß")).toBe("/images/categories/strassespass.png");
  });
});
