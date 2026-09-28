import { describe, expect, it } from "vitest";

import { containsHtmlMarkup } from "./eventPresentation";

describe("containsHtmlMarkup", () => {
  it("recognizes markup with nonempty content between angle brackets", () => {
    expect(containsHtmlMarkup("Text <strong>fett</strong>")).toBe(true);
    expect(containsHtmlMarkup("<> <em>kursiv</em>")).toBe(true);
    expect(containsHtmlMarkup("<<>")).toBe(true);
  });

  it("ignores incomplete or empty angle brackets", () => {
    expect(containsHtmlMarkup("Text <> ohne Markup")).toBe(false);
    expect(containsHtmlMarkup("<".repeat(10_000))).toBe(false);
    expect(containsHtmlMarkup("Text <offen")).toBe(false);
  });
});
