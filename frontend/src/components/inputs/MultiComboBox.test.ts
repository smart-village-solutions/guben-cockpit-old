import { describe, expect, it } from "vitest";

import { sortComboboxOptionValues } from "./MultiComboBox";

describe("sortComboboxOptionValues", () => {
  it("sorts values by their visible labels rather than their IDs", () => {
    const optionsIndex = {
      "900": { value: "900", label: "Zentrum" },
      "100": { value: "100", label: "Ärzte" },
      "500": { value: "500", label: "Bildung" },
    };

    expect(sortComboboxOptionValues(["900", "100", "500"], optionsIndex)).toEqual([
      "100",
      "500",
      "900",
    ]);
  });

  it("uses the ID as a stable tie-breaker for identical labels", () => {
    const optionsIndex = {
      "20": { value: "20", label: "Sport" },
      "10": { value: "10", label: "Sport" },
    };

    expect(sortComboboxOptionValues(["20", "10"], optionsIndex)).toEqual(["10", "20"]);
  });
});
