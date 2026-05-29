import type { ReactNode } from "react";
import { Trash2Icon } from "lucide-react";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import type { Project } from "@shared/public-content/contracts";

type MockEvent = {
  id: string;
  eventId: string;
  terminId: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  location: {
    id: string;
    name: string;
    city: string;
    street: string;
    telephoneNumber: null;
    fax: null;
    email: null;
    website: null;
    zip: string;
  };
  coordinates: {
    latitude: number;
    longitude: number;
  };
  urls: [];
  categories: Array<{ id: string; name: string }>;
  images: [];
  published: boolean;
};

type ProjectsQueryData = {
  businesses: {
    totalCount: number;
    pageCount: number;
    results: Project[];
  };
  seo: undefined;
};

type ProjectDetailQueryData = {
  results: Project[];
  _category: string;
  seo: undefined;
};

type EventDetailQueryData = {
  event: MockEvent;
  seo: undefined;
};

type EventsQueryData = {
  events: {
    results: MockEvent[];
    categories: Array<{ id: string; name: string }>;
    bookingTenants: Array<{ id: string; tenantId: string }>;
    pageCount: number;
    pageNumber?: number;
    pageSize?: number;
    totalCount?: number;
  };
  seo: undefined;
};

const mockState = vi.hoisted(() => {
  const project = {
    id: "project-1",
    type: 1,
    title: "Project",
    description: "Project description",
    fullText: "Project full text",
    imageCaption: null,
    imageUrl: null,
    imageCredits: null,
    published: true,
  };

  const event = {
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
  };

  return {
    isGatewayPublicContentEnabled: true,
    routerEvent: undefined as unknown,
    tickets: [] as Array<{ title: string; bookingUrl?: string; prices?: unknown[]; flags?: string[]; location?: string; autoCommitNote?: string }>,
    eventsStore: {
      events: [] as any[],
      processedTenants: new Set<string>(),
      markProcessedTenants: vi.fn(),
      getTicketsByBkid: vi.fn(() => []),
    },
    projectsQuery: {
      data: {
        businesses: {
          totalCount: 1,
          pageCount: 1,
          results: [project],
        },
        seo: undefined,
      } as ProjectsQueryData | null,
      error: null as unknown,
      isPending: false,
      refetch: vi.fn(),
    },
    projectDetailQuery: {
      data: {
        results: [project],
        _category: "marketplace",
        seo: undefined,
      } as ProjectDetailQueryData | null,
      error: null as unknown,
      isPending: false,
      refetch: vi.fn(),
    },
    eventDetailQuery: {
      data: {
        event,
        seo: undefined,
      } as EventDetailQueryData | null,
      error: null as unknown,
      isPending: false,
      refetch: vi.fn(),
    },
    eventsQuery: {
      data: {
        events: {
          results: [event],
          categories: [{ id: "category-1", name: "Culture" }],
          bookingTenants: [] as any[],
          pageCount: 1,
        },
        seo: undefined,
      } as EventsQueryData | null,
      error: null as unknown,
      isPending: false,
      refetch: vi.fn(),
    },
  };
});

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
        state: mockState.routerEvent ? { event: mockState.routerEvent } : {},
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

vi.mock("@/components/ui/Breadcrumb", () => ({
  Breadcrumb: ({ items }: { items: Array<{ label: string }> }) => (
    <nav>{items.map((item) => item.label).join(" > ")}</nav>
  ),
}));

vi.mock("@/components/home/MapComponent", () => ({
  MapComponent: () => <div>Map</div>,
}));

vi.mock("@/components/booking/priceCard", () => ({
  default: ({ title }: { title: string }) => <div>{title}</div>,
}));

vi.mock("@/components/ui/DetailPageLayout", () => ({
  DetailPageLayout: ({
    title,
    children,
    metadata,
    breadcrumbItems,
  }: {
    title: ReactNode;
    children: ReactNode;
    metadata?: ReactNode;
    breadcrumbItems?: Array<{ label: string }>;
  }) => (
    <main>
      {breadcrumbItems ? <nav>{breadcrumbItems.map((item) => item.label).join(" > ")}</nav> : null}
      <h1>{title}</h1>
      {metadata}
      <div>{children}</div>
    </main>
  ),
}));

vi.mock("@/components/public-content/PublicContentDisabledState", () => ({
  PublicContentDisabledState: () => <div>Public Content Disabled</div>,
}));

vi.mock("@/components/public-content/PublicContentErrorState", () => ({
  PublicContentErrorState: ({ error }: { error: unknown }) => (
    <div>Public Content Error: {String(error ?? "none")}</div>
  ),
}));

vi.mock("@/public-content/source", () => ({
  get isGatewayPublicContentEnabled() {
    return mockState.isGatewayPublicContentEnabled;
  },
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

vi.mock("@/stores/eventStore", () => {
  const useEventStore = (selector: (state: any) => unknown) => selector(mockState.eventsStore);
  (useEventStore as any).getState = () => ({
    ...mockState.eventsStore,
    getTicketsByBkid: vi.fn(() => mockState.tickets),
  });

  return { useEventStore };
});

vi.mock("@/public-content/hooks", () => ({
  useGatewayProjectsContent: () => mockState.projectsQuery,
  useGatewayProjectDetailContent: () => mockState.projectDetailQuery,
  useGatewayEventDetailContent: () => mockState.eventDetailQuery,
  useGatewayEventsContent: () => mockState.eventsQuery,
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

beforeEach(() => {
  mockState.isGatewayPublicContentEnabled = true;
  mockState.routerEvent = undefined;
  mockState.tickets = [];
  mockState.eventsStore = {
    events: [],
    processedTenants: new Set<string>(),
    markProcessedTenants: vi.fn(),
    getTicketsByBkid: vi.fn(() => mockState.tickets),
  };
  mockState.projectsQuery = {
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
    } as ProjectsQueryData | null,
    error: null,
    isPending: false,
    refetch: vi.fn(),
  };
  mockState.projectDetailQuery = {
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
    } as ProjectDetailQueryData | null,
    error: null,
    isPending: false,
    refetch: vi.fn(),
  };
  mockState.eventDetailQuery = {
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
    } as EventDetailQueryData | null,
    error: null,
    isPending: false,
    refetch: vi.fn(),
  };
  mockState.eventsQuery = {
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
    } as EventsQueryData | null,
    error: null,
    isPending: false,
    refetch: vi.fn(),
  };
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

  it("renders disabled states for public content pages", () => {
    mockState.isGatewayPublicContentEnabled = false;

    expect(renderToStaticMarkup(<GatewayEventsPage />)).toContain("Public Content Disabled");
    expect(renderToStaticMarkup(<ProjectsMarketplacePage />)).toContain("Public Content Disabled");
    expect(renderToStaticMarkup(<GatewayProjectDetailPage projectId="project-1" />)).toContain("Public Content Disabled");
    expect(renderToStaticMarkup(<GatewayEventDetailPage eventId="event-1" />)).toContain("Public Content Disabled");
  });

  it("renders the projects marketplace loading, error, and empty states", () => {
    mockState.projectsQuery.isPending = true;
    expect(renderToStaticMarkup(<ProjectsMarketplacePage />)).toContain("animate-pulse");

    mockState.projectsQuery.isPending = false;
    mockState.projectsQuery.data = null;
    mockState.projectsQuery.error = "boom";
    expect(renderToStaticMarkup(<ProjectsMarketplacePage />)).toContain("Public Content Error: boom");

    mockState.projectsQuery.error = null;
    mockState.projectsQuery.data = {
      businesses: {
        totalCount: 0,
        pageCount: 1,
        results: [],
      },
      seo: undefined,
    };
    expect(renderToStaticMarkup(<ProjectsMarketplacePage />)).toContain("Keine Marktplatz-Angebote verfügbar");
  });

  it("renders the gateway project detail error states", () => {
    mockState.projectDetailQuery.data = null;
    mockState.projectDetailQuery.error = "project-failed";
    expect(renderToStaticMarkup(<GatewayProjectDetailPage projectId="project-1" />)).toContain("Public Content Error: project-failed");

    mockState.projectDetailQuery.error = null;
    mockState.projectDetailQuery.data = { results: [], _category: "marketplace", seo: undefined };
    expect(renderToStaticMarkup(<GatewayProjectDetailPage projectId="project-1" />)).toContain("Public Content Error: none");
  });

  it("renders the gateway event detail loading and error states", () => {
    mockState.eventDetailQuery.isPending = true;
    mockState.eventDetailQuery.data = null;
    expect(renderToStaticMarkup(<GatewayEventDetailPage eventId="event-1" />)).toContain("Event wird geladen");

    mockState.eventDetailQuery.isPending = false;
    mockState.eventDetailQuery.error = "event-failed";
    expect(renderToStaticMarkup(<GatewayEventDetailPage eventId="event-1" />)).toContain("Public Content Error: event-failed");
  });

  it("renders the gateway events error and integration paths", () => {
    mockState.eventsQuery.data = null;
    mockState.eventsQuery.error = "events-failed";
    expect(renderToStaticMarkup(<GatewayEventsPage />)).toContain("Public Content Error: events-failed");

    mockState.eventsQuery.error = null;
    mockState.eventsQuery.data = {
      events: {
        results: [],
        categories: [],
        bookingTenants: [{ id: "tenant-1", tenantId: "tenant-1" }],
        pageCount: 1,
      },
      seo: undefined,
    };
    expect(renderToStaticMarkup(<GatewayEventsPage />)).toContain("Integration");
  });
});
