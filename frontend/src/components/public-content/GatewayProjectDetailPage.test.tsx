import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GatewayProjectDetailPage } from "./GatewayProjectDetailPage";

const queryState = vi.hoisted(() => ({
  data: {
    kind: "featured",
    project: {
        id: "project-1",
        type: 2,
        title: "Projekt 1",
        description: "Kurzbeschreibung",
        fullText: "<p>Langtext</p>",
        imageCaption: null,
        imageUrl: "/project-image.jpg",
        imageCredits: null,
        published: true,
      },
    seo: undefined,
  } as any,
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
    breadcrumbItems,
    metadata,
    children,
  }: {
    title: ReactNode;
    heroImage?: string;
    breadcrumbItems?: Array<{ label: string }>;
    metadata?: ReactNode;
    children: ReactNode;
  }) => (
    <div>
      {breadcrumbItems ? <nav>{breadcrumbItems.map((item) => item.label).join(" > ")}</nav> : null}
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
    queryState.data.project.description = "Kurzbeschreibung";
    queryState.data.project.imageUrl = "/project-image.jpg";
    queryState.data.project.fullText = "<p>Langtext</p>";
  });

  it("renders the project image beside the description and keeps the full text below", () => {
    render(<GatewayProjectDetailPage projectId="project-1" />);

    expect(screen.getByText("Startseite > Mein Guben > Projekt 1")).toBeTruthy();
    expect(screen.getByRole("img", { name: "Projekt 1" })).toBeTruthy();
    expect(screen.getByText("Projektdetails")).toBeTruthy();
    expect(screen.getByText("Langtext")).toBeTruthy();
    expect(screen.getAllByText("Kurzbeschreibung")).toHaveLength(1);
    expect(screen.queryByTestId("detail-header-image")).toBeNull();
  });

  it("renders the project image even when the short description is empty", () => {
    queryState.data.project.description = "";

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
    queryState.data.project.description = "";
    queryState.data.project.fullText = "";

    render(<GatewayProjectDetailPage projectId="project-1" />);

    expect(screen.getByRole("img", { name: "Projekt 1" })).toBeTruthy();
    expect(screen.queryByText("Übersicht")).toBeNull();
    expect(screen.queryByText("Projektdetails")).toBeNull();
    expect(screen.queryByTestId("detail-header-image")).toBeNull();
  });

  it("renders available POI details and sanitizes HTML", () => {
    queryState.data = {
      kind: "poi",
      poi: {
        id: "poi:1",
        title: "Schule 1",
        description: "<p>Beschreibung</p><script>alert(1)</script>",
        imageUrl: null,
        updatedAt: null,
        categories: [{ id: "6186", name: "Schulen", parentId: null, parentName: null }],
        locationValue: "guben",
        locationLabel: "Guben",
        coordinates: null,
        media: [],
        address: { street: "Schulstraße 1", addition: null, zip: "03172", city: "Guben" },
        contact: { firstName: null, lastName: null, email: "info@example.com", phone: "+49 1", fax: null },
        webUrls: [{ url: "https://example.com/", description: "Website" }],
        openingHours: [{ weekday: "Montag", timeFrom: "08:00", timeTo: "16:00", description: null, open: true, sortNumber: 1 }],
        operatingCompany: null,
        dataProvider: "Stadt Guben",
      },
      seo: undefined,
    };

    render(<GatewayProjectDetailPage projectId="poi:1" />);

    expect(screen.getByText("Beschreibung")).toBeTruthy();
    expect(document.querySelector("script")).toBeNull();
    expect(screen.getByText("Schulstraße 1")).toBeTruthy();
    const emailLink = screen.getByRole("link", { name: "info@example.com" });
    const phoneLink = screen.getByRole("link", { name: "+49 1" });
    const websiteLink = screen.getByRole("link", { name: "Website" });
    const contactLinks = emailLink.closest(".prose");

    expect(emailLink.getAttribute("href")).toBe("mailto:info@example.com");
    expect(contactLinks).not.toBeNull();
    expect(contactLinks?.contains(phoneLink)).toBe(true);
    expect(contactLinks?.contains(websiteLink)).toBe(true);
    expect(screen.getByText("Montag")).toBeTruthy();
    expect(screen.getByText("Schulen")).toBeTruthy();
  });
});
