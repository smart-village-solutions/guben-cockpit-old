import { describe, expect, it } from "vitest";

import { validateProjectsSearch } from "@/routes/projects/index";

describe("validateProjectsSearch", () => {
  it("restores valid POI filters from route search", () => {
    expect(validateProjectsSearch({
      search: " Schule ",
      categoryIds: ["6186", "6187", "6186"],
      location: "guben",
      radius: "10",
      sort: "updatedAt",
      direction: "desc",
      page: "2",
      pageSize: "25",
    })).toEqual({
      search: "Schule",
      categoryIds: ["6186", "6187"],
      location: "guben",
      radius: 10,
      sort: "updatedAt",
      direction: "desc",
      page: 2,
      pageSize: 25,
    });
  });

  it("normalizes invalid values to safe defaults", () => {
    expect(validateProjectsSearch({ radius: 999, sort: "random", direction: "descending", page: -1, pageSize: 1000 })).toEqual({
      search: undefined,
      categoryIds: [],
      location: undefined,
      radius: undefined,
      sort: "name",
      direction: "asc",
      page: 1,
      pageSize: 12,
    });
  });
});
