import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

describe("buildplace iframe test route", () => {
  it("is registered as a hidden file route", () => {
    const routeTree = readFileSync(resolve(__dirname, "../../routeTree.gen.ts"), "utf8");

    expect(routeTree).toContain('"/buildplace-iframe-test"');
    expect(routeTree).toContain('"filePath": "buildplace-iframe-test.tsx"');
  });

  it("renders the Buildplace map iframe and direct link", async () => {
    const routeModule = await import("@/routes/buildplace-iframe-test");
    const RouteComponent = routeModule.Route.options.component as () => JSX.Element;

    render(<RouteComponent />);

    const iframe = screen.getByTitle("Buildplace iframe test");
    const directLink = screen.getByRole("link", {
      name: "public.buildplace.io/_/stadt-guben/portfolio/-/overview/map",
    });

    expect(screen.getByRole("heading", { name: "Buildplace Map iframe Test" })).toBeTruthy();
    expect(iframe.getAttribute("src")).toBe(routeModule.buildplaceMapUrl);
    expect(iframe.getAttribute("referrerpolicy")).toBe("no-referrer");
    expect(directLink.getAttribute("href")).toBe(routeModule.buildplaceMapUrl);
    expect(directLink.getAttribute("rel")).toBe("noreferrer");
  });
});
