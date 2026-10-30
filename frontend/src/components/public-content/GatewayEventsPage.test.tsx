import { act, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createMemoryHistory, createRootRoute, createRoute, createRouter, Outlet, RouterProvider } from "@tanstack/react-router";
import { GatewayEventsPage } from "./GatewayEventsPage";
import { validateEventsSearch, type EventsSearch } from "@/components/events/eventSearchState";

const mocks = vi.hoisted(() => ({ query: vi.fn(), empty: [] as unknown[], processed: new Set<string>() }));
vi.mock("react-i18next", () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
vi.mock("@/public-content/source", () => ({ isGatewayPublicContentEnabled: true }));
vi.mock("@/public-content/useRouteMetadata", () => ({ useRouteMetadata: vi.fn() }));
vi.mock("@/public-content/hooks", () => ({ useGatewayEventsContent: (params: unknown) => {
  mocks.query(params);
  return { data: { events: { results: [], bookingTenants: [], categories: [{ id: "market", name: "Markt" }], pageCount: 3, totalCount: 0 } }, isPending: false, error: null };
} }));
vi.mock("@/stores/eventStore", () => ({ useEventStore: (selector: (state: unknown) => unknown) => selector({ events: mocks.empty, processedTenants: mocks.processed, markProcessedTenants: vi.fn() }) }));
vi.mock("@/components/events/citizenInformationSystemBanner", () => ({ default: () => null }));
vi.mock("@/components/events/eventCard", () => ({ default: () => null }));
vi.mock("@/components/events/eventIntegration", () => ({ default: () => null }));
vi.mock("@/components/filters/categoryFilter", () => ({ CategoryFilter: ({ onChange }: { onChange: (value: string) => void }) => <button onClick={() => onChange("market")}>Choose market</button> }));
vi.mock("@/components/filters/DistanceFilter", () => ({ DistanceFilter: () => null }));
vi.mock("@/components/filters/dateRangeFilter", () => ({ DateRangeFilter: () => null }));
vi.mock("@/components/events/sortFilter", async (original) => ({ ...await original<object>(), default: () => null }));
vi.mock("@/components/DataDisplay/PaginationContainer", () => ({ PaginationContainer: ({ children, nextPage, setPageSize }: { children: React.ReactNode; nextPage: () => void; setPageSize: (size: number) => void }) => <>{children}<button onClick={nextPage}>Next page</button><button onClick={() => setPageSize(50)}>50 per page</button></> }));

afterEach(() => { vi.useRealTimers(); });

function ControlledPage({ initial = validateEventsSearch({}) }: { initial?: EventsSearch }) {
  const [search, setSearch] = useState(initial);
  return <GatewayEventsPage search={search} onSearchChange={setSearch} />;
}

describe("event search interactions", () => {
  it("waits 300ms after the last keystroke and resets the page", () => {
    vi.useFakeTimers();
    render(<ControlledPage initial={validateEventsSearch({ page: 3 })} />);
    fireEvent.change(screen.getByLabelText("Search"), { target: { value: "Floh" } });
    act(() => { vi.advanceTimersByTime(200); });
    fireEvent.change(screen.getByLabelText("Search"), { target: { value: "Flohmarkt" } });
    act(() => { vi.advanceTimersByTime(299); });
    expect(mocks.query.mock.lastCall?.[0]).not.toHaveProperty("title");
    act(() => { vi.advanceTimersByTime(1); });
    expect(mocks.query.mock.lastCall?.[0]).toMatchObject({ title: "Flohmarkt", pageNumber: 1 });
  });

  it("shows active filters, clears them together and cancels pending input", () => {
    vi.useFakeTimers();
    render(<ControlledPage initial={validateEventsSearch({ search: "Markt", category: "market", distance: 10, from: "2026-10-30", page: 2, pageSize: 50 })} />);
    expect(screen.getByText("Category: Markt")).toBeTruthy();
    expect(screen.getByText("Radius: 10 km")).toBeTruthy();
    expect(screen.getByText("Date: 2026-10-30")).toBeTruthy();
    fireEvent.change(screen.getByLabelText("Search"), { target: { value: "pending" } });
    fireEvent.click(screen.getByRole("button", { name: "ResetFilters" }));
    act(() => { vi.advanceTimersByTime(500); });
    expect((screen.getByLabelText("Search") as HTMLInputElement).value).toBe("");
    expect(mocks.query.mock.lastCall?.[0]).toEqual({ pageNumber: 1, pageSize: 50 });
    expect(screen.queryByText("ActiveFilters")).toBeNull();
  });

  it("commits pending text with an immediate category change and resets page size changes", () => {
    vi.useFakeTimers();
    render(<ControlledPage initial={validateEventsSearch({ page: 3 })} />);
    fireEvent.change(screen.getByLabelText("Search"), { target: { value: "Flohmarkt" } });
    fireEvent.click(screen.getByText("Choose market"));
    expect(mocks.query.mock.lastCall?.[0]).toMatchObject({ title: "Flohmarkt", category: "market", pageNumber: 1 });
    fireEvent.click(screen.getByText("Next page"));
    expect(mocks.query.mock.lastCall?.[0]).toMatchObject({ pageNumber: 2 });
    fireEvent.click(screen.getByText("50 per page"));
    expect(mocks.query.mock.lastCall?.[0]).toMatchObject({ pageNumber: 1, pageSize: 50 });
  });

  it("restores URL filters and page through browser Back and Forward", async () => {
    const root = createRootRoute({ component: Outlet });
    const route = createRoute({ getParentRoute: () => root, path: "/events", validateSearch: validateEventsSearch,
      component: () => {
        const search = route.useSearch();
        const navigate = route.useNavigate();
        return <GatewayEventsPage search={search} onSearchChange={(next) => { void navigate({ to: "/events", search: next }); }} />;
      },
    });
    const history = createMemoryHistory({ initialEntries: ["/events?search=Markt&page=2&pageSize=50"] });
    const router = createRouter({ routeTree: root.addChildren([route]), history });
    await router.load();
    render(<RouterProvider<typeof router> router={router} />);
    expect((await screen.findByLabelText("Search") as HTMLInputElement).value).toBe("Markt");
    fireEvent.click(screen.getByText("Next page"));
    await act(async () => { await router.load(); });
    expect(router.state.location.search).toMatchObject({ search: "Markt", page: 3, pageSize: 50 });
    fireEvent.click(screen.getByText("Choose market"));
    await act(async () => { await router.load(); });
    expect(router.state.location.search).toMatchObject({ category: "market", page: 1 });
    await act(async () => { history.back(); await router.load(); });
    expect(router.state.location.search).toMatchObject({ search: "Markt", page: 3 });
    expect(router.state.location.search.category).toBeUndefined();
    await act(async () => { history.forward(); await router.load(); });
    expect(router.state.location.search).toMatchObject({ category: "market", page: 1 });
    await act(async () => { await router.navigate({ to: "/events", search: { search: "Konzert", page: 1, pageSize: 50 } }); });
    expect((screen.getByLabelText("Search") as HTMLInputElement).value).toBe("Konzert");
    fireEvent.change(screen.getByLabelText("Search"), { target: { value: "pending" } });
    await act(async () => { history.back(); await router.load(); });
    await act(async () => { await new Promise((resolve) => setTimeout(resolve, 350)); });
    expect((screen.getByLabelText("Search") as HTMLInputElement).value).toBe("Markt");
    expect(router.state.location.search).toMatchObject({ search: "Markt", category: "market" });
  });
});
