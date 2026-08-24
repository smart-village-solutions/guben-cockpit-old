import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import "@/utilities/dateExtensions";
import type { EventDetailContent } from "@shared/public-content/contracts";

import { GatewayEventDetailPage } from "./GatewayEventDetailPage";

const queryState = vi.hoisted(() => ({
  data: {
    event: {
      id: "event-1",
      eventId: "event-1",
      terminId: "termin-1",
      title: "Sommerfest",
      description: "Ein grosses Sommerfest",
      startDate: "2026-06-01T10:00:00",
      endDate: "2026-06-01T12:00:00",
      location: {
        id: "location-1",
        name: "Altstadt",
        street: "Musterstrasse 1",
        zip: "03172",
        city: "Guben",
      },
      coordinates: {
        latitude: 51.949,
        longitude: 14.715,
      },
      urls: [] as EventDetailContent["event"]["urls"],
      categories: [{ id: "category-1", name: "Fest" }],
      images: [
        {
          thumbnailUrl: "/thumb-1.jpg",
          previewUrl: "/preview-1.jpg",
          originalUrl: "/image-1.jpg",
        },
        {
          thumbnailUrl: "/thumb-2.jpg",
          previewUrl: "/preview-2.jpg",
          originalUrl: "/image-2.jpg",
        },
      ],
      organizerName: null as EventDetailContent["event"]["organizerName"],
      contact: null as EventDetailContent["event"]["contact"],
      priceInformations: [] as NonNullable<EventDetailContent["event"]["priceInformations"]>,
      dataProviderName: null as EventDetailContent["event"]["dataProviderName"],
      registrationRequired: undefined as EventDetailContent["event"]["registrationRequired"],
      maximumAttendees: undefined as EventDetailContent["event"]["maximumAttendees"],
      published: true,
    },
    seo: undefined,
  },
  isPending: false,
  error: null as unknown,
  refetch: vi.fn(),
}));

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => vi.fn(),
  useRouter: () => ({ state: { location: { state: {} } } }),
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock("@/public-content/source", () => ({
  isGatewayPublicContentEnabled: true,
}));

vi.mock("@/public-content/hooks", () => ({
  useGatewayEventDetailContent: () => queryState,
}));

vi.mock("@/public-content/useRouteMetadata", () => ({
  useRouteMetadata: vi.fn(),
}));

vi.mock("@/stores/eventStore", () => ({
  useEventStore: {
    getState: () => ({
      getTicketsByBkid: () => [],
    }),
  },
}));

vi.mock("@/components/home/MapComponent", () => ({
  MapComponent: () => <div>map-component</div>,
}));

vi.mock("@/components/booking/priceCard", () => ({
  default: () => <div>price-card</div>,
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

describe("GatewayEventDetailPage", () => {
  beforeEach(() => {
    queryState.isPending = false;
    queryState.error = null;
    queryState.data.event.startDate = "2026-06-01T10:00:00";
    queryState.data.event.endDate = "2026-06-01T12:00:00";
    queryState.data.event.location = {
      id: "location-1",
      name: "Altstadt",
      street: "Musterstrasse 1",
      zip: "03172",
      city: "Guben",
    };
    queryState.data.event.organizerName = null;
    queryState.data.event.contact = null;
    queryState.data.event.priceInformations = [];
    queryState.data.event.dataProviderName = null;
    queryState.data.event.registrationRequired = undefined;
    queryState.data.event.maximumAttendees = undefined;
  });

  it("renders event images in the shared content media slot instead of the header", () => {
    render(<GatewayEventDetailPage eventId="event-1" />);

    expect(screen.getByText("EventDetails")).toBeTruthy();
    expect(screen.getByRole("img", { name: "Sommerfest" })).toBeTruthy();
    expect(screen.getByText("1 / 2")).toBeTruthy();
    expect(screen.queryByText("map-component")).toBeNull();
    expect(screen.getByText("Musterstrasse 1, 03172 Guben (Altstadt)")).toBeTruthy();
    expect(screen.getByText("01.06.2026 10:00 - 12:00")).toBeTruthy();
    expect(screen.queryByTestId("detail-header-image")).toBeNull();
  });

  it("falls back to the location name when no address is available", () => {
    queryState.data.event.location = {
      id: "location-1",
      name: "Altstadt",
      street: null,
      zip: null,
      city: null,
    } as unknown as typeof queryState.data.event.location;

    render(<GatewayEventDetailPage eventId="event-1" />);

    expect(screen.getByText("Altstadt")).toBeTruthy();
    expect(screen.queryByText(/null/)).toBeNull();
  });

  it("renders a midnight end on the next day without repeating the date", () => {
    queryState.data.event.startDate = "2026-05-30T09:00:00";
    queryState.data.event.endDate = "2026-05-31T00:00:00";

    render(<GatewayEventDetailPage eventId="event-1" />);

    expect(screen.getByText("30.05.2026 09:00 - 23:59")).toBeTruthy();
  });

  it("renders HTML event descriptions as markup instead of plain text", () => {
    queryState.data.event.description = "<p>Ein <strong>grosses</strong> Sommerfest</p>";

    const { container } = render(<GatewayEventDetailPage eventId="event-1" />);

    expect(container.querySelector("strong")?.textContent).toBe("grosses");
    expect(screen.queryByText("<p>Ein")).toBeNull();
  });

  it("does not render the map even when the event has coordinates", () => {
    queryState.data.event.coordinates = {
      latitude: 51.949,
      longitude: 14.715,
    };

    render(<GatewayEventDetailPage eventId="event-1" />);

    expect(screen.queryByText("map-component")).toBeNull();
  });

  it("does not render the map when the event has no coordinates", () => {
    queryState.data.event.coordinates = null as unknown as typeof queryState.data.event.coordinates;

    render(<GatewayEventDetailPage eventId="event-1" />);

    expect(screen.queryByText("map-component")).toBeNull();
  });

  it("renders optional event metadata without rendering empty sections", () => {
    queryState.data.event.organizerName = "Guben Kultur";
    queryState.data.event.contact = {
      email: "kontakt@example.test",
      phone: "+49 3561 123",
      website: "https://example.test",
    };
    queryState.data.event.priceInformations = [
      { name: "Erwachsene", amount: 3, description: "Abendkasse" },
    ];
    queryState.data.event.urls = [{ link: "https://tickets.example.test", description: "Tickets" }];
    queryState.data.event.dataProviderName = "Cockpit User";

    render(<GatewayEventDetailPage eventId="event-1" />);

    expect(screen.getByText("Veranstaltet von")).toBeTruthy();
    expect(screen.getByText("Guben Kultur")).toBeTruthy();
    expect(screen.getByRole("link", { name: /kontakt@example.test/ }).getAttribute("href")).toBe("mailto:kontakt@example.test");
    expect(screen.getByText(/Erwachsene.*Abendkasse/)).toBeTruthy();
    expect(screen.getByRole("link", { name: /Tickets/ }).getAttribute("href")).toBe("https://tickets.example.test");
    expect(screen.getByText("Quelle: Cockpit User")).toBeTruthy();
  });

  it("renders available participation information", () => {
    queryState.data.event.registrationRequired = true;
    queryState.data.event.maximumAttendees = 120;

    render(<GatewayEventDetailPage eventId="event-1" />);

    expect(screen.getByText("Teilnahme")).toBeTruthy();
    expect(screen.getByText("Anmeldung erforderlich")).toBeTruthy();
    expect(screen.getByText("Maximale Teilnehmerzahl: 120")).toBeTruthy();
  });

  it("distinguishes no registration requirement and hides unknown participation information", () => {
    const { rerender } = render(<GatewayEventDetailPage eventId="event-1" />);

    expect(screen.queryByText("Teilnahme")).toBeNull();

    queryState.data.event.registrationRequired = false;
    rerender(<GatewayEventDetailPage eventId="event-1" />);

    expect(screen.getByText("Keine Anmeldung erforderlich")).toBeTruthy();
  });
});
