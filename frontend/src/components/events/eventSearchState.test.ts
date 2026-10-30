import { describe, expect, it } from "vitest";
import { eventsSearchToFilters, formatEventSearchDate, validateEventsSearch } from "./eventSearchState";
import { buildEventsQueryFilters } from "./eventPageUtils";
import { SortOption, SortOrder } from "./sortFilter";

describe("event URL state", () => {
  it("rejects malformed parameters independently", () => {
    expect(validateEventsSearch({ search: ["bad"], category: "culture", page: -2, pageSize: 999,
      distance: 17, from: "2026-02-30", to: "yesterday", sortBy: "bad", ordering: "bad" }))
      .toMatchObject({ search: undefined, category: "culture", page: 1, pageSize: 25,
        distance: undefined, from: undefined, to: undefined, sortBy: undefined, ordering: undefined });
    expect(validateEventsSearch({ from: "2026-10-30", to: "2026-10-29" }).to).toBeUndefined();
  });

  it("restores a shared URL and preserves calendar dates without timezone shifts", () => {
    const search = validateEventsSearch(Object.fromEntries(new URLSearchParams(
      "search=Tr%C3%B6del&category=market&distance=10&from=2026-10-30&to=2026-11-01&page=3&pageSize=50&sortBy=title&ordering=descending",
    )));
    expect(search).toMatchObject({ search: "Trödel", page: 3, pageSize: 50, distance: 10 });
    const filters = eventsSearchToFilters(search);
    expect(formatEventSearchDate(filters.dateRange!.from)).toBe("2026-10-30");
    expect(formatEventSearchDate(filters.dateRange!.to!)).toBe("2026-11-01");
    expect(buildEventsQueryFilters(filters)).toMatchObject({ title: "Trödel", sortBy: "title", ordering: "desc" });
  });

  it("maps both UI sort directions to the API", () => {
    expect(buildEventsQueryFilters({ sortBy: SortOption.START_DATE, ordering: SortOrder.ASC }).ordering).toBe("asc");
    expect(buildEventsQueryFilters({ sortBy: SortOption.START_DATE, ordering: SortOrder.DESC }).ordering).toBe("desc");
  });
});
