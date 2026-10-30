import { describe, expect, it } from "vitest";
import { createEventTitleMatcher } from "./event-search.js";

describe("event title search", () => {
  it.each([
    ["  FLOHMARKT   Guben ", "„Flohmarkt in Guben“"],
    ["Guben Flohmarkt", "Flohmarkt in Guben"],
    ["Troedel", "Trödelmarkt"],
    ["Trödel", "Troedelmarkt"],
    ["fruehling strasse", "Frühling in der Straße"],
    ["Kinder-Flohmarkt", "Kinder–Flohmarkt"],
    ["\"Flohmarkt\"", "„Flohmarkt“"],
    ["  ", "Sommerfest"],
    ["ＦＬＯＨ", "Flohmarkt"],
    ["Troedel", "Tro\u0308delmarkt"],
  ])("matches %s against %s", (query, title) => {
    expect(createEventTitleMatcher(query)(title)).toBe(true);
  });

  it("requires every query token", () => {
    expect(createEventTitleMatcher("Flohmarkt Berlin")("Flohmarkt in Guben")).toBe(false);
  });
});
