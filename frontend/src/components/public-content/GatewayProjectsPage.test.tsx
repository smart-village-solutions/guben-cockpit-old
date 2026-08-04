import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

const state = vi.hoisted(() => ({
  query: {
    data: {
      featuredProjects: [
        {
          id: "project-1",
          type: 1,
          title: "Projekt 1",
          description: "<p>Ein <strong>wichtiger</strong> Text</p>",
          fullText: "",
          imageCaption: null,
          imageUrl: null,
          imageCredits: null,
          published: true,
        },
      ],
      schools: [],
      businesses: {
        pageNumber: 1,
        pageSize: 1,
        totalCount: 0,
        pageCount: 1,
        results: [],
      },
      seo: undefined,
    },
    error: null as unknown,
    isPending: false,
    refetch: vi.fn(),
  },
  poisQuery: {
    data: { pageNumber: 1, pageSize: 12, totalCount: 0, pageCount: 1, results: [], categories: [], locations: [] },
    error: null as unknown,
    isPending: false,
    refetch: vi.fn(),
  },
}));

vi.mock("@/public-content/source", () => ({
  isGatewayPublicContentEnabled: true,
}));

vi.mock("@/public-content/useRouteMetadata", () => ({
  useRouteMetadata: vi.fn(),
}));

vi.mock("@/public-content/hooks", () => ({
  useGatewayFeaturedProjectsContent: () => state.query,
  useGatewayPoisContent: () => state.poisQuery,
}));

vi.mock("@/components/projects/CategoryTiles", () => ({
  CategoryTiles: () => <div>Category Tiles</div>,
}));

vi.mock("@/components/ui/skeleton", () => ({
  Skeleton: () => <div>Loading</div>,
}));

vi.mock("@/components/public-content/PublicContentErrorState", () => ({
  PublicContentErrorState: ({ error }: { error: unknown }) => <div>Error: {String(error)}</div>,
}));

vi.mock("@/components/public-content/PublicContentDisabledState", () => ({
  PublicContentDisabledState: () => <div>Disabled</div>,
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) =>
      ({
        ReadMore: "Mehr erfahren",
      })[key] ?? key,
  }),
}));

vi.mock("swiper/react", () => ({
  Swiper: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SwiperSlide: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("swiper/modules", () => ({
  Navigation: {},
  Pagination: {},
  Autoplay: {},
}));

import { GatewayProjectsPage } from "@/components/public-content/GatewayProjectsPage";

describe("GatewayProjectsPage", () => {
  it("strips HTML tags from featured project descriptions in the slider", () => {
    const markup = renderToStaticMarkup(<GatewayProjectsPage />);

    expect(markup).toContain("Ein wichtiger Text");
    expect(markup).toContain("Mehr erfahren &gt;");
    expect(markup).not.toContain("&lt;p&gt;");
    expect(markup).not.toContain("&lt;strong&gt;");
    expect(markup).toContain("bg-gubenAccent");
    expect(markup).toContain("grid-cols-5");
    expect(markup).toContain("lucide-arrow-down-wide-narrow");
    expect(markup).toContain("bg-transparent");
    expect(markup).toContain("text-white");
    expect(markup).not.toContain("id=\"poi-sort\"");
    expect(markup).not.toContain("Category Tiles");
    expect(markup).toContain("Radius");
    expect(markup).not.toContain("PoiResetFilters");
  });

  it("keeps the featured slider visible when only the POI request fails", () => {
    const previousData = state.poisQuery.data;
    state.poisQuery.data = undefined as unknown as typeof previousData;
    state.poisQuery.error = new Error("POI upstream unavailable");

    const markup = renderToStaticMarkup(<GatewayProjectsPage />);

    expect(markup).toContain("Projekt 1");
    expect(markup).toContain("POI upstream unavailable");
    state.poisQuery.data = previousData;
    state.poisQuery.error = null;
  });
});
