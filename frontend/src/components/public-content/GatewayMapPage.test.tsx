import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { GatewayMapPage } from "./GatewayMapPage";

vi.mock("@/public-content/source", () => ({ isGatewayPublicContentEnabled: true }));
vi.mock("@/public-content/useRouteMetadata", () => ({ useRouteMetadata: vi.fn() }));
vi.mock("@/public-content/hooks", () => ({
  useGatewayMapContent: () => ({
    isPending: false,
    error: null,
    data: {
      page: { title: "Gubener Stadtkarte", description: "Orte in Guben entdecken" },
      map: { embedUrl: "https://example.org/guben-map" },
    },
  }),
}));

describe("GatewayMapPage", () => {
  it("gives the embedded map a descriptive accessible title derived from its page", () => {
    render(<GatewayMapPage />);

    const map = screen.getByTitle("Interaktive Karte: Gubener Stadtkarte");
    expect(map.tagName).toBe("IFRAME");
    expect(map.getAttribute("src")).toBe("https://example.org/guben-map");
    expect(screen.getByRole("heading", { name: "Gubener Stadtkarte" })).toBeTruthy();
  });
});
