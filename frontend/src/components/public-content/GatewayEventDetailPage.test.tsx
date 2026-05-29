import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import "@/utilities/dateExtensions";

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
      urls: [],
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
  });

  it("renders event images in the shared content media slot instead of the header", () => {
    render(<GatewayEventDetailPage eventId="event-1" />);

    expect(screen.getByText("EventDetails")).toBeTruthy();
    expect(screen.getByRole("img", { name: "Sommerfest" })).toBeTruthy();
    expect(screen.getByText("1 / 2")).toBeTruthy();
    expect(screen.getByText("map-component")).toBeTruthy();
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
});
