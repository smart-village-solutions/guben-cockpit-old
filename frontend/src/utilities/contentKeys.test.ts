import { describe, expect, it } from "vitest";
import { withContentKeys } from "./contentKeys";

describe("withContentKeys", () => {
  it("retains row identity when unrelated rows are inserted or reordered", () => {
    const before = withContentKeys(["standard", "reduced"], String);
    const after = withContentKeys(["new", "reduced", "standard"], String);
    expect(after.find(({ item }) => item === "standard")?.key).toBe(before[0].key);
    expect(after.find(({ item }) => item === "reduced")?.key).toBe(before[1].key);
  });

  it("preserves identical rows with distinct repeatable keys", () => {
    const rows = ["same", "other", "same"];
    const keyed = withContentKeys(rows, String);
    expect(new Set(keyed.map(({ key }) => key)).size).toBe(rows.length);
    expect(keyed.map(({ item }) => item)).toEqual(rows);
    expect(withContentKeys(rows, String)).toEqual(keyed);
  });
});
