import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const routeOptions = vi.hoisted(() => new Map<string, { component: () => JSX.Element }>());

vi.mock("@tanstack/react-router", () => ({
  createLazyFileRoute: (path: string) => (options: { component: () => JSX.Element }) => {
    routeOptions.set(path, options);
    return {};
  },
  Navigate: (props: { to: string; search: { categoryIds: string[] } }) => (
    <div>{`${props.to}:${props.search.categoryIds.join(",")}`}</div>
  ),
}));

describe("legacy project category routes", () => {
  it("redirects Schools and Marketplace to verified POI category filters", async () => {
    await import("@/routes/projects/schools.lazy");
    await import("@/routes/projects/marketplace.lazy");

    const Schools = routeOptions.get("/projects/schools")!.component;
    const Marketplace = routeOptions.get("/projects/marketplace")!.component;
    render(<><Schools /><Marketplace /></>);

    expect(screen.getByText("/projects:6186")).toBeTruthy();
    expect(screen.getByText("/projects:6187")).toBeTruthy();
  });
});
