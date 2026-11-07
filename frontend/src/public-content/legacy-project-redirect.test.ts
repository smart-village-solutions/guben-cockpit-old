import { describe, expect, it } from "vitest";
import { Route } from "../routes/projects/$projectId";

describe("legacy project route", () => {
  it.each(["237", "238", "553", "999999"])("redirects legacy ID %s before loading the detail page", (projectId) => {
    const beforeLoad = Route.options.beforeLoad;
    expect(typeof beforeLoad).toBe("function");
    if (typeof beforeLoad !== "function") return;
    let result: unknown;
    try {
      beforeLoad({ params: { projectId } } as never);
    } catch (error) {
      result = error;
    }
    expect(result).toMatchObject({
      isRedirect: true,
      to: "/projects",
      replace: true,
      search: { categoryIds: [], sort: "name", direction: "asc", page: 1, pageSize: 12 },
    });
  });

  it.each(["featured:5553", "poi:123", "schools", "marketplace"])("preserves route %s", (projectId) => {
    const beforeLoad = Route.options.beforeLoad;
    expect(typeof beforeLoad).toBe("function");
    if (typeof beforeLoad === "function") {
      expect(beforeLoad({ params: { projectId } } as never)).toBeUndefined();
    }
  });
});
