import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GatewayProjectDetailPage } from "./GatewayProjectDetailPage";

const queryState = vi.hoisted(() => ({
  data: {
    results: [
      {
        id: "project-1",
        type: 2,
        title: "Projekt 1",
        description: "Kurzbeschreibung",
        fullText: "<p>Langtext</p>",
        imageCaption: null,
        imageUrl: "/project-image.jpg",
        imageCredits: null,
        published: true,
        _category: "schools",
      },
    ],
    _category: "schools",
    seo: undefined,
  },
  isPending: false,
  error: null as unknown,
  refetch: vi.fn(),
}));

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => vi.fn(),
}));

vi.mock("@/public-content/source", () => ({
  isGatewayPublicContentEnabled: true,
}));

vi.mock("@/public-content/hooks", () => ({
  useGatewayProjectDetailContent: () => queryState,
}));

vi.mock("@/public-content/useRouteMetadata", () => ({
  useRouteMetadata: vi.fn(),
}));

vi.mock("@/components/ui/DetailPageLayout", () => ({
  DetailPageLayout: ({
    title,
    heroImage,
    metadata,
    children,
  }: {
    title: ReactNode;
    heroImage?: string;
    metadata?: ReactNode;
    children: ReactNode;
  }) => (
    <div>
      <h1>{title}</h1>
      {heroImage ? <img data-testid="detail-header-image" alt="" src={heroImage} /> : null}
      <div>{metadata}</div>
      <div>{children}</div>
    </div>
  ),
}));

vi.mock("./PublicContentErrorState", () => ({
  PublicContentErrorState: () => <div>error-state</div>,
}));

vi.mock("./PublicContentDisabledState", () => ({
  PublicContentDisabledState: () => <div>disabled-state</div>,
}));

describe("GatewayProjectDetailPage", () => {
  beforeEach(() => {
    queryState.isPending = false;
    queryState.error = null;
    queryState.data.results[0].description = "Kurzbeschreibung";
    queryState.data.results[0].imageUrl = "/project-image.jpg";
  });

  it("renders the project image beside the description and keeps the full text below", () => {
    render(<GatewayProjectDetailPage projectId="project-1" />);

    expect(screen.getByRole("img", { name: "Projekt 1" })).toBeTruthy();
    expect(screen.getByText("Projektdetails")).toBeTruthy();
    expect(screen.getByText("Langtext")).toBeTruthy();
    expect(screen.getAllByText("Kurzbeschreibung")).toHaveLength(1);
    expect(screen.queryByTestId("detail-header-image")).toBeNull();
  });

  it("renders the project image even when the short description is empty", () => {
    queryState.data.results[0].description = "";

    render(<GatewayProjectDetailPage projectId="project-1" />);

    const image = screen.getByRole("img", { name: "Projekt 1" });
    const detailHeading = screen.getByRole("heading", { name: "Projektdetails" });
    const detailSection = detailHeading.closest("section");

    expect(image).toBeTruthy();
    expect(screen.queryByText("Übersicht")).toBeNull();
    expect(detailHeading).toBeTruthy();
    expect(detailSection).not.toBeNull();
    expect(detailSection?.contains(image)).toBe(true);
  });

  it("renders the project image even when both description fields are empty", () => {
    queryState.data.results[0].description = "";
    queryState.data.results[0].fullText = "";

    render(<GatewayProjectDetailPage projectId="project-1" />);

    expect(screen.getByRole("img", { name: "Projekt 1" })).toBeTruthy();
    expect(screen.queryByText("Übersicht")).toBeNull();
    expect(screen.queryByText("Projektdetails")).toBeNull();
    expect(screen.queryByTestId("detail-header-image")).toBeNull();
  });
});
