import { Suspense } from "react";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const routeParams = {
  eventId: "event-1",
  projectId: "project-1",
};

const homeQueryState = {
  isPending: false,
  error: null as unknown,
  refetch: vi.fn(),
  data: {
    page: {
      title: "Home Title",
      description: "Home Description",
    },
    dashboard: {
      dropdowns: [{ id: "dropdown-1", title: "Dropdown", tabs: [] }],
    },
    seo: undefined,
  },
};

const mapQueryState = {
  isPending: false,
  error: null as unknown,
  refetch: vi.fn(),
  data: {
    map: { embedUrl: "https://example.com/map" },
    seo: undefined,
  },
};

const bookingState = {
  bookings: [
    { tenantId: "tenant-1", category: "room", title: "Room 1" },
    { tenantId: "tenant-1", category: "resource", title: "Resource 1" },
    { tenantId: "tenant-1", category: "sport", title: "Sport 1" },
  ],
  processedTenants: new Set<string>(),
  markProcessedTenants: vi.fn(),
  addBookings: vi.fn(),
  reset: vi.fn(),
};

const bookingTenantsState = {
  data: {
    tenants: [] as Array<{ tenantId: string }>,
  },
};

vi.mock("@tanstack/react-router", () => {
  const createRoute = () => (_path: string) => (options: Record<string, unknown> = {}) => ({
    options,
    useParams: () => routeParams,
  });

  return {
    createRootRoute: (options: Record<string, unknown> = {}) => ({ options }),
    createFileRoute: createRoute(),
    createLazyFileRoute: createRoute(),
    Outlet: () => <div>Outlet</div>,
  };
});

vi.mock("@/components/Navbar", () => ({
  Navbar: () => <div>Navbar</div>,
}));

vi.mock("@/components/layout/Footer", () => ({
  Footer: () => <div>Footer</div>,
}));

vi.mock("@/components/ui/sonner", () => ({
  Toaster: () => <div>Toaster</div>,
}));

vi.mock("@/components/home/DashboardDropdownNav", () => ({
  DashboardDropdownTabs: ({ dropdowns }: { dropdowns: unknown[] }) => (
    <div>DashboardDropdownTabs {dropdowns.length}</div>
  ),
}));

vi.mock("@/components/public-content/PublicContentErrorState", () => ({
  PublicContentErrorState: () => <div>Public Content Error</div>,
}));

vi.mock("@/components/ui/skeleton", () => ({
  Skeleton: () => <div>Skeleton</div>,
}));

vi.mock("@/public-content/hooks", () => ({
  useGatewayHomeContent: () => homeQueryState,
  useGatewayMapContent: () => mapQueryState,
  useGatewayBookingTenants: () => bookingTenantsState,
}));

vi.mock("@/public-content/useRouteMetadata", () => ({
  useRouteMetadata: vi.fn(),
}));

vi.mock("react-markdown", () => ({
  default: ({ children }: { children: string }) => <div>{children}</div>,
}));

vi.mock("@/components/public-content/GatewayEventsPage", () => ({
  GatewayEventsPage: () => <div>GatewayEventsPage</div>,
}));

vi.mock("@/components/ui/Breadcrumb", () => ({
  Breadcrumb: ({ items }: { items: Array<{ label: string }> }) => (
    <nav>{items.map((item) => item.label).join(" > ")}</nav>
  ),
}));

vi.mock("@/components/public-content/GatewayEventDetailPage", () => ({
  GatewayEventDetailPage: ({ eventId }: { eventId: string }) => <div>Event {eventId}</div>,
}));

vi.mock("@/stores/bookingStore", () => ({
  useBookingStore: (selector: (state: typeof bookingState) => unknown) => selector(bookingState),
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: "de" },
  }),
}));

vi.mock("i18next", () => ({
  default: {
    language: "de",
  },
}));

vi.mock("@/utilities/translateUtils", () => ({
  translateBatchedMultiple: vi.fn(),
  translateHtmlBatchedMultiple: vi.fn(),
}));

vi.mock("@/components/booking/bookingCard", () => ({
  default: ({ booking }: { booking: { title: string } }) => <div>{booking.title}</div>,
}));

vi.mock("@/components/booking/bookingDivider", () => ({
  default: ({ text }: { text: string }) => <div>{text}</div>,
}));

vi.mock("@/components/booking/bookingIntegration", () => ({
  default: () => <div>BookingIntegration</div>,
}));

vi.mock("@/components/booking/bookingHowItWorks", () => ({
  default: () => <div>BookingHowItWorks</div>,
}));

vi.mock("@/components/booking/bookingFaq", () => ({
  default: () => <div>BookingFaq</div>,
}));

vi.mock("@/components/booking/bookingComponent", () => ({
  default: () => <div>BookingComponent</div>,
}));

vi.mock("@/components/booking/bookingRoom", () => ({
  default: () => <div>BookingRoom</div>,
}));

vi.mock("@/components/public-content/GatewayProjectDetailPage", () => ({
  GatewayProjectDetailPage: ({ projectId }: { projectId: string }) => <div>Project {projectId}</div>,
}));

vi.mock("@/builder/BuilderPreviewEntry", () => ({
  default: () => <div>BuilderPreviewEntry</div>,
}));

describe("route coverage", () => {
  beforeEach(() => {
    homeQueryState.isPending = false;
    homeQueryState.error = null;
    homeQueryState.data = {
      page: {
        title: "Home Title",
        description: "Home Description",
      },
      dashboard: {
        dropdowns: [{ id: "dropdown-1", title: "Dropdown", tabs: [] }],
      },
      seo: undefined,
    };

    mapQueryState.isPending = false;
    mapQueryState.error = null;
    mapQueryState.data = {
      map: { embedUrl: "https://example.com/map" },
      seo: undefined,
    };

    bookingTenantsState.data = { tenants: [] };
    bookingState.processedTenants = new Set<string>();
  });

  it("covers root and builder preview route components", async () => {
    const { RootComponent } = await import("@/routes/__root");
    const { BuilderPreviewRoute } = await import("@/routes/builder-preview");

    render(
      <div>
        <RootComponent />
        <Suspense fallback={<div>Loading</div>}>
          <BuilderPreviewRoute />
        </Suspense>
      </div>,
    );

    expect(screen.getByText("Navbar")).toBeTruthy();
    expect(await screen.findByText("Footer")).toBeTruthy();
    expect(await screen.findByText("Toaster")).toBeTruthy();
    expect(await screen.findByText("BuilderPreviewEntry")).toBeTruthy();
  }, 10000);

  it("covers home route success path and search validation", async () => {
    const homeModule = await import("@/routes/index");
    const validateSearch = homeModule.Route.options.validateSearch;

    render(<homeModule.HomeComponent />);

    expect(screen.getByText("Home Title")).toBeTruthy();
    expect(screen.getByText("Home Description")).toBeTruthy();
    expect(await screen.findByText("DashboardDropdownTabs 1")).toBeTruthy();
    expect(typeof validateSearch).toBe("function");
    if (typeof validateSearch !== "function") {
      throw new Error("Expected validateSearch to be a function");
    }
    expect(validateSearch({ selectedTabId: "abc", ignored: 1 })).toEqual({
      selectedTabId: "abc",
    });
  });

  it("covers map route pending, error and success paths", async () => {
    const { MapComponent } = await import("@/routes/map.lazy");

    homeQueryState.refetch.mockReset();
    mapQueryState.isPending = true;
    const { rerender } = render(<MapComponent />);
    expect(screen.getByText("Skeleton")).toBeTruthy();

    mapQueryState.isPending = false;
    mapQueryState.error = new Error("boom");
    rerender(<MapComponent />);
    expect(screen.getByText("Public Content Error")).toBeTruthy();

    mapQueryState.error = null;
    rerender(<MapComponent />);
    expect(document.querySelector("iframe")?.getAttribute("src")).toBe("https://example.com/map");
  });

  it("covers events routes and project detail route", async () => {
    const eventsIndexModule = await import("@/routes/events/index.lazy");
    const eventDetailModule = await import("@/routes/events/$eventId.lazy");
    const projectDetailModule = await import("@/routes/projects/$projectId.lazy");

    render(
      <div>
        <eventsIndexModule.RouteComponent />
        <eventDetailModule.EventDetailRoute eventId="event-42" />
        <projectDetailModule.ProjectDetailRoute projectId="project-42" />
      </div>,
    );

    expect(screen.getByText("GatewayEventsPage")).toBeTruthy();
    expect(screen.getByText("Event event-42")).toBeTruthy();
    expect(screen.getByText("Project project-42")).toBeTruthy();
  });

  it("covers booking routes", async () => {
    const bookingIndexModule = await import("@/routes/booking/index.lazy");
    const bookingTitleModule = await import("@/routes/booking/$title.lazy");
    const bookingRoomModule = await import("@/routes/booking/room/$title.lazy");

    bookingTenantsState.data = { tenants: [{ tenantId: "tenant-1" }] };

    render(
      <div>
        <bookingIndexModule.Booking />
        <bookingTitleModule.BookingInformation />
        <bookingRoomModule.BookingInformation />
      </div>,
    );

    expect(screen.getByText("Willkommen in der Buchungsübersicht")).toBeTruthy();
    expect(screen.getByText("BookingIntegration")).toBeTruthy();
    expect(screen.getByText("rooms")).toBeTruthy();
    expect(screen.getByText("BookingComponent")).toBeTruthy();
    expect(screen.getByText("BookingRoom")).toBeTruthy();
  }, 10000);

  it("imports route shell modules so their route declarations are covered", async () => {
    await import("@/routes/map");
    await import("@/routes/events");
    await import("@/routes/events/index");
    await import("@/routes/events/$eventId");
    await import("@/routes/booking/index");
    await import("@/routes/booking/$title");
    await import("@/routes/booking/room/$title");
    await import("@/routes/projects/$projectId");
  });
});
