import type { ReactNode } from "react";
import { Trash2Icon } from "lucide-react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to, className }: { children: ReactNode; to: string; className?: string }) => (
    <a href={to} className={className}>
      {children}
    </a>
  ),
  useNavigate: () => vi.fn(),
  useRouter: () => ({
    state: {
      location: {
        state: {},
      },
    },
  }),
}));

vi.mock("@/components/general/Tooltip", () => ({
  CustomTooltip: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

vi.mock("@/components/ui/dialog", async () => {
  const actual = await vi.importActual<object>("@/components/ui/dialog");
  return {
    ...actual,
    DialogTrigger: ({ children }: { children: ReactNode }) => <>{children}</>,
    Dialog: ({ children }: { children: ReactNode }) => <>{children}</>,
    DialogContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  };
});

vi.mock("@/components/events/citizenInformationSystemBanner", () => ({
  default: () => <div>Banner</div>,
}));

vi.mock("@/components/events/eventCard", () => ({
  default: ({ event }: { event: { title: string } }) => <div>{event.title}</div>,
}));

vi.mock("@/components/events/eventIntegration", () => ({
  default: () => <div>Integration</div>,
}));

vi.mock("@/components/events/sortFilter", () => ({
  __esModule: true,
  default: () => <div>SortFilter</div>,
  SortOption: { date: "date" },
  SortOrder: { asc: "asc", desc: "desc" },
}));

vi.mock("@/components/filters/categoryFilter", () => ({
  CategoryFilter: () => <div>CategoryFilter</div>,
}));

vi.mock("@/components/filters/dateRangeFilter", () => ({
  DateRangeFilter: () => <div>DateRangeFilter</div>,
}));

vi.mock("@/components/filters/DistanceFilter", () => ({
  DistanceFilter: () => <div>DistanceFilter</div>,
}));

vi.mock("@/components/filters/searchFilter", () => ({
  SearchFilter: () => <div>SearchFilter</div>,
}));

vi.mock("@/components/DataDisplay/PaginationContainer", () => ({
  PaginationContainer: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/components/home/MapComponent", () => ({
  MapComponent: () => <div>Map</div>,
}));

vi.mock("@/components/booking/priceCard", () => ({
  default: ({ title }: { title: string }) => <div>{title}</div>,
}));

vi.mock("@/public-content/source", () => ({
  isGatewayPublicContentEnabled: true,
}));

vi.mock("@/public-content/useRouteMetadata", () => ({
  useRouteMetadata: vi.fn(),
}));

vi.mock("@/utilities/translateUtils", () => ({
  TranslatedHtml: ({ text }: { text: string }) => <div>{text}</div>,
  TranslatedText: ({ text }: { text: string }) => <span>{text}</span>,
  translateBatchedMultiple: vi.fn(),
  translateHtmlBatchedMultiple: vi.fn(),
}));

vi.mock("@/hooks/usePagination", () => ({
  usePagination: () => ({
    page: 1,
    pageSize: 10,
    total: 1,
    pageCount: 1,
    nextPage: vi.fn(),
    previousPage: vi.fn(),
    setPageIndex: vi.fn(),
    setPageSize: vi.fn(),
    setTotal: vi.fn(),
    setPageCount: vi.fn(),
  }),
}));

vi.mock("@/stores/eventStore", () => ({
  useEventStore: (selector: (state: any) => unknown) =>
    selector({
      events: [],
      processedTenants: new Set<string>(),
      markProcessedTenants: vi.fn(),
    }),
}));

vi.mock("@/public-content/hooks", () => ({
  useGatewayProjectsContent: () => ({
    data: {
      businesses: {
        totalCount: 1,
        pageCount: 1,
        results: [
          {
            id: "project-1",
            type: 1,
            title: "Project",
            description: "Project description",
            fullText: "Project full text",
            imageCaption: null,
            imageUrl: null,
            imageCredits: null,
            published: true,
          },
        ],
      },
      seo: undefined,
    },
    error: null,
    isPending: false,
    refetch: vi.fn(),
  }),
  useGatewayProjectDetailContent: () => ({
    data: {
      results: [
        {
          id: "project-1",
          type: 1,
          title: "Project",
          description: "Project description",
          fullText: "Project full text",
          imageCaption: null,
          imageUrl: null,
          imageCredits: null,
          published: true,
        },
      ],
      _category: "marketplace",
      seo: undefined,
    },
    error: null,
    isPending: false,
    refetch: vi.fn(),
  }),
  useGatewayEventDetailContent: () => ({
    data: {
      event: {
        id: "event-1",
        eventId: "event-id",
        terminId: "termin-id",
        title: "Event",
        description: "Event description",
        startDate: "2026-04-10T10:00:00.000Z",
        endDate: "2026-04-10T12:00:00.000Z",
        location: {
          id: "location-1",
          name: "Town Hall",
          city: "Guben",
          street: "Main Street 1",
          telephoneNumber: null,
          fax: null,
          email: null,
          website: null,
          zip: "03172",
        },
        coordinates: {
          latitude: 51.95,
          longitude: 14.71,
        },
        urls: [],
        categories: [{ id: "category-1", name: "Culture" }],
        images: [],
        published: true,
      },
      seo: undefined,
    },
    error: null,
    isPending: false,
    refetch: vi.fn(),
  }),
  useGatewayEventsContent: () => ({
    data: {
      events: {
        results: [
          {
            id: "event-1",
            eventId: "event-id",
            terminId: "termin-id",
            title: "Event",
            description: "Event description",
            startDate: "2026-04-10T10:00:00.000Z",
            endDate: "2026-04-10T12:00:00.000Z",
            location: {
              id: "location-1",
              name: "Town Hall",
              city: "Guben",
              street: "Main Street 1",
              telephoneNumber: null,
              fax: null,
              email: null,
              website: null,
              zip: "03172",
            },
            coordinates: {
              latitude: 51.95,
              longitude: 14.71,
            },
            urls: [],
            categories: [{ id: "category-1", name: "Culture" }],
            images: [],
            published: true,
          },
        ],
        categories: [{ id: "category-1", name: "Culture" }],
        bookingTenants: [],
        pageCount: 1,
      },
      seo: undefined,
    },
    error: null,
    isPending: false,
    refetch: vi.fn(),
  }),
}));

import { DeleteIconButton } from "@/components/iconButtons/DeleteIconButton";
import { EditIconButton } from "@/components/iconButtons/EditIconButton";
import { IconButtonBase } from "@/components/iconButtons/IconButtonBase";
import ProjectCard from "@/components/projects/projectCard";
import { GatewayEventDetailPage } from "@/components/public-content/GatewayEventDetailPage";
import { GatewayEventsPage } from "@/components/public-content/GatewayEventsPage";
import { GatewayProjectDetailPage } from "@/components/public-content/GatewayProjectDetailPage";
import { ProjectsMarketplacePage } from "@/components/public-content/ProjectsMarketplacePage";
import { InfoCard } from "@/components/home/InfoCard/InfoCard";

beforeAll(() => {
  Object.defineProperty(Date.prototype, "formatDateTime", {
    value: function formatDateTime() {
      return this.toISOString();
    },
    configurable: true,
  });
});

describe("Sonar fix smoke tests", () => {
  it("renders icon buttons as semantic buttons", () => {
    const deleteMarkup = renderToStaticMarkup(
      <DeleteIconButton tooltip="Delete" dialogTrigger={false} onClick={vi.fn()} />,
    );
    const editMarkup = renderToStaticMarkup(
      <EditIconButton tooltip="Edit" onClick={vi.fn()} />,
    );
    const baseMarkup = renderToStaticMarkup(
      <IconButtonBase icon={Trash2Icon} onClick={vi.fn()} className="text-red-500" label="Remove item" />,
    );

    expect(deleteMarkup).toContain("button");
    expect(deleteMarkup).toContain('aria-label="Delete"');
    expect(editMarkup).toContain("button");
    expect(editMarkup).toContain('aria-label="Edit"');
    expect(baseMarkup).toContain("text-red-500");
    expect(baseMarkup).toContain('title="Remove item"');
  });

  it("renders cards and detail pages with nullable image data", () => {
    const infoMarkup = renderToStaticMarkup(
      <InfoCard
        card={{
          id: "card-1",
          title: null,
          description: "Description",
          imageUrl: null,
          imageAlt: null,
          button: null,
        }}
      />,
    );
    const projectMarkup = renderToStaticMarkup(
      <ProjectCard
        project={{
          id: "project-1",
          type: 1,
          title: "Project",
          description: "Project description",
          fullText: "Project full text",
          imageCaption: null,
          imageUrl: null,
          imageCredits: null,
          published: true,
        }}
      />,
    );
    const detailMarkup = renderToStaticMarkup(<GatewayProjectDetailPage projectId="project-1" />);

    expect(infoMarkup).toContain("Description");
    expect(infoMarkup).toContain("Information");
    expect(projectMarkup).toContain("Project");
    expect(detailMarkup).toContain("Projekt");
  });

  it("renders public content pages after hook-order fixes", () => {
    const eventsMarkup = renderToStaticMarkup(<GatewayEventsPage />);
    const eventDetailMarkup = renderToStaticMarkup(<GatewayEventDetailPage eventId="event-1" />);
    const marketplaceMarkup = renderToStaticMarkup(<ProjectsMarketplacePage />);

    expect(eventsMarkup).toContain("Event");
    expect(eventDetailMarkup).toContain("Event");
    expect(marketplaceMarkup).toContain("Marktplatz");
  });
});
