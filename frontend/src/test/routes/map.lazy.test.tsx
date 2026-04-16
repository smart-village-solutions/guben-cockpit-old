import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mapQueryState = {
  isPending: false,
  error: null as unknown,
  refetch: vi.fn(),
  data: {
    map: { embedUrl: "https://example.com/map" },
    seo: undefined,
  },
};

vi.mock("@tanstack/react-router", () => ({
  createLazyFileRoute: () => (_options: Record<string, unknown>) => ({}),
}));

vi.mock("@/public-content/hooks", () => ({
  useGatewayMapContent: () => mapQueryState,
}));

vi.mock("@/public-content/useRouteMetadata", () => ({
  useRouteMetadata: vi.fn(),
}));

vi.mock("@/components/public-content/PublicContentErrorState", () => ({
  PublicContentErrorState: () => <div>Public Content Error</div>,
}));

vi.mock("@/components/ui/skeleton", () => ({
  Skeleton: ({ className }: { className?: string }) => <div className={className}>Skeleton</div>,
}));

describe("map route", () => {
  beforeEach(() => {
    mapQueryState.isPending = false;
    mapQueryState.error = null;
    mapQueryState.data = {
      map: { embedUrl: "https://example.com/map" },
      seo: undefined,
    };
  });

  it("renders the loading skeleton with the responsive sizing classes", async () => {
    const { MapComponent } = await import("@/routes/map.lazy");

    mapQueryState.isPending = true;
    render(<MapComponent />);

    const skeleton = screen.getByText("Skeleton");
    expect(skeleton.className).toContain("min-h-[28rem]");
    expect(skeleton.className).toContain("flex-1");
  });

  it("renders the error state when the map query fails", async () => {
    const { MapComponent } = await import("@/routes/map.lazy");

    mapQueryState.error = new Error("boom");
    render(<MapComponent />);

    expect(screen.getByText("Public Content Error")).toBeTruthy();
  });

  it("renders an accessible iframe for the map", async () => {
    const { MapComponent } = await import("@/routes/map.lazy");

    const { container } = render(<MapComponent />);

    const iframe = container.querySelector("iframe");
    expect(iframe?.getAttribute("src")).toBe("https://example.com/map");
    expect(iframe?.getAttribute("title")).toBe("Gateway map");
    expect(iframe?.className).toContain("absolute");
  });
});
