import { describe, expect, it } from "vitest";

import { formatEventLocation } from "./location";

describe("formatEventLocation", () => {
  it("returns the full address with location name when both are present", () => {
    expect(
      formatEventLocation({
        name: "Altstadt",
        street: "Musterstrasse 1",
        zip: "03172",
        city: "Guben",
      }),
    ).toBe("Musterstrasse 1, 03172 Guben (Altstadt)");
  });

  it("falls back to the location name when no address is available", () => {
    expect(
      formatEventLocation({
        name: "Altstadt",
        street: null,
        zip: null,
        city: null,
      }),
    ).toBe("Altstadt");
  });

  it("returns only the available address parts when no location name exists", () => {
    expect(
      formatEventLocation({
        name: null,
        street: null,
        zip: "03172",
        city: "Guben",
      }),
    ).toBe("03172 Guben");
  });
});
