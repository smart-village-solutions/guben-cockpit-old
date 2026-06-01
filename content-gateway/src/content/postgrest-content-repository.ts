import {
  BookingTenantsContent,
  DashboardContent,
  EventDetailContent,
  EventsContent,
  FooterContent,
  HomeContent,
  MapContent,
  PublicContentBundle,
  ProjectsContent,
  bookingTenantsContentSchema,
  footerContentSchema,
  homeContentSchema,
  eventsContentSchema,
  projectsContentSchema,
  publicContentBundleSchema,
} from "../../../shared/public-content/contracts.js";
import { Config } from "../config.js";
import { GatewayError } from "../errors.js";
import { PostgrestClient } from "../upstream/postgrest-client.js";
import { PublicContentRepository } from "./content-repository.js";
import { PostgrestContentMapper, distanceInKm } from "./postgrest-content-mapper.js";
import { PostgrestContentSource } from "./postgrest-content-source.js";
import { EventFilters, EventCategoryRow, EventImageRow, EventUrlRow } from "./postgrest-content-types.js";

const additionalBookingTenants = [
  {
    id: "smart-city-booking-bike-boxes",
    tenantId: "2b12ce76-c513-40d0-bb56-51a597556f9d",
  },
] as const;

export class PostgrestContentRepository implements PublicContentRepository {
  private readonly mapper: PostgrestContentMapper;
  private readonly source: PostgrestContentSource;

  public constructor(
    private readonly config: Config,
    client: PostgrestClient,
  ) {
    this.mapper = new PostgrestContentMapper(config);
    this.source = new PostgrestContentSource(client);
  }

  public async getHome(language: string): Promise<HomeContent> {
    const [pages, dashboard] = await Promise.all([
      this.source.getPage("Home"),
      this.getDashboard(language),
    ]);

    const page = this.mapper.pageFromRow(this.expectSingle(pages, "Home"), language);
    return homeContentSchema.parse({
      page,
      dashboard: {
        dropdowns: dashboard.dropdowns,
      },
      seo: page.seo,
    });
  }

  public async getProjects(
    language: string,
    pageNumber: number,
    pageSize: number,
  ): Promise<ProjectsContent> {
    const [pages, rows] = await Promise.all([this.source.getPage("Projects"), this.source.getProjects()]);

    const filtered = rows.filter((row) => row.published && !row.deleted);
    const featuredProjects = filtered
      .filter((row) => row.type === 1)
      .map((row) => this.mapper.projectFromRow(row, language));
    const schools = filtered
      .filter((row) => row.type === 2)
      .map((row) => this.mapper.projectFromRow(row, language));
    const businessesAll = filtered
      .filter((row) => row.type === 0)
      .map((row) => this.mapper.projectFromRow(row, language));
    const startIndex = (pageNumber - 1) * pageSize;
    const page = this.mapper.pageFromRow(this.expectSingle(pages, "Projects"), language);

    return projectsContentSchema.parse({
      page,
      featuredProjects,
      schools,
      businesses: {
        pageNumber,
        pageSize,
        totalCount: businessesAll.length,
        pageCount: Math.max(1, Math.ceil(businessesAll.length / pageSize)),
        results: businessesAll.slice(startIndex, startIndex + pageSize),
      },
      seo: page.seo,
    });
  }

  public async getPublicContent(language: string): Promise<PublicContentBundle> {
    const [homePages, dashboard, projectPages, rows] = await Promise.all([
      this.source.getPage("Home"),
      this.getDashboard(language),
      this.source.getPage("Projects"),
      this.source.getProjects(),
    ]);

    const homePage = this.mapper.pageFromRow(this.expectSingle(homePages, "Home"), language);
    const projectsPage = this.mapper.pageFromRow(this.expectSingle(projectPages, "Projects"), language);
    const items = rows
      .filter((row) => row.published && !row.deleted && (row.type === 0 || row.type === 1 || row.type === 2))
      .map((row) => this.mapper.publicProjectFromRow(row, language));

    return publicContentBundleSchema.parse({
      home: {
        page: homePage,
        dropdowns: dashboard.dropdowns,
        cards: this.mapper.flattenedHomeCards(dashboard.dropdowns),
      },
      projects: {
        page: projectsPage,
        items,
      },
    });
  }

  // Legacy-only PostgREST event path. Production /api/content/events* traffic is
  // composed through SmartVillagePostgrestContentRepository so the remaining
  // PostgREST event assumptions stay isolated here for maintenance and fallback use.
  public async getEvents(language: string, filters: EventFilters): Promise<EventsContent> {
    const [pages, bundle] = await Promise.all([this.source.getPage("Events"), this.source.getEventsBundle()]);
    const locations = new Map(bundle.locationRows.map((row) => [row.id, row]));
    const categoriesByEvent = this.groupRowsByEvent(bundle.categoryRows);
    const urlsByEvent = this.groupRowsByEvent(bundle.urlRows);
    const imagesByEvent = this.groupRowsByEvent(bundle.imageRows);

    let results = bundle.eventRows
      .filter((row) => row.published && !row.deleted)
      .map((row) =>
        this.mapper.eventFromRow(row, language, locations, categoriesByEvent, urlsByEvent, imagesByEvent),
      );

    results = this.filterEvents(results, filters);
    this.sortEvents(results, filters);

    const categories = Array.from(
      new Map(results.flatMap((event) => event.categories).map((category) => [category.id, category])).values(),
    );

    const page = this.mapper.pageFromRow(this.expectSingle(pages, "Events"), language);
    const startIndex = (filters.pageNumber - 1) * filters.pageSize;
    const pagedResults = results.slice(startIndex, startIndex + filters.pageSize);

    return eventsContentSchema.parse({
      page,
      events: {
        pageNumber: filters.pageNumber,
        pageSize: filters.pageSize,
        totalCount: results.length,
        pageCount: Math.max(1, Math.ceil(results.length / filters.pageSize)),
        results: pagedResults,
        categories,
        bookingTenants: bundle.bookingTenantRows.map((row) => ({
          id: row.id,
          tenantId: row.tenant_id,
        })),
      },
      seo: page.seo,
    });
  }

  public async getEventById(language: string, id: string): Promise<EventDetailContent> {
    const detailBundle = await this.source.getEventDetailBundle(id);
    if (!detailBundle) {
      throw new GatewayError({
        code: "NOT_FOUND",
        message: "Requested event was not found",
        statusCode: 404,
        upstream: "gateway",
        retryable: false,
      });
    }

    const locations = new Map(detailBundle.locationRows.map((row) => [row.id, row]));
    const event = this.mapper.eventFromRow(
      detailBundle.eventRow,
      language,
      locations,
      this.groupRowsByEvent(detailBundle.categoryRows),
      this.groupRowsByEvent(detailBundle.urlRows),
      this.groupRowsByEvent(detailBundle.imageRows),
    );

    return this.mapper.eventDetailFromEvent(id, event);
  }

  public async getDashboard(language: string): Promise<DashboardContent> {
    return this.mapper.dashboardFromRows(language, await this.source.getDashboardRows());
  }

  public async getMap(language: string): Promise<MapContent> {
    const pages = await this.source.getPage("Map");
    return this.mapper.mapContent(language, pages[0]);
  }

  public async getFooter(): Promise<FooterContent> {
    return footerContentSchema.parse({
      items: await this.source.getFooterRows(),
    });
  }

  public async getBookingTenants(): Promise<BookingTenantsContent> {
    const tenants = [
      ...(await this.source.getBookingTenantRows()).map((row) => ({
        id: row.id,
        tenantId: row.tenant_id,
      })),
      ...additionalBookingTenants,
    ];

    return bookingTenantsContentSchema.parse({
      tenants: Array.from(
        tenants.reduce((deduped, tenant) => {
          if (!deduped.has(tenant.tenantId)) {
            deduped.set(tenant.tenantId, tenant);
          }
          return deduped;
        }, new Map<string, (typeof tenants)[number]>()),
      ).map(([, tenant]) => tenant),
    });
  }

  private expectSingle<T>(rows: T[], resource: string): T {
    const row = rows[0];
    if (!row) {
      throw new GatewayError({
        code: "NOT_FOUND",
        message: `${resource} content was not found`,
        statusCode: 404,
        upstream: "postgrest",
        retryable: false,
      });
    }

    return row;
  }

  private groupRowsByEvent<T extends EventCategoryRow | EventUrlRow | EventImageRow>(rows: T[]) {
    const grouped = new Map<string, T[]>();
    for (const row of rows) {
      grouped.set(row.event_id, [...(grouped.get(row.event_id) ?? []), row]);
    }
    return grouped;
  }

  private filterEvents(events: EventsContent["events"]["results"], filters: EventFilters) {
    let results = events;

    if (filters.title) {
      const needle = filters.title.toLowerCase();
      results = results.filter((event) => event.title.toLowerCase().includes(needle));
    }

    if (filters.category) {
      results = results.filter((event) =>
        event.categories.some((category) => category.id === filters.category),
      );
    }

    const startDate = filters.startDate ? new Date(filters.startDate) : undefined;
    const endDate = filters.endDate ? new Date(filters.endDate) : undefined;
    if (startDate || endDate) {
      results = results.filter((event) => {
        const eventStart = new Date(event.startDate);
        const eventEnd = new Date(event.endDate);
        return (!startDate || eventEnd >= startDate) && (!endDate || eventStart <= endDate);
      });
    }

    if (filters.distance && filters.distance > 0) {
      const maxDistance = filters.distance;
      results = results.filter((event) => {
        if (!event.coordinates) {
          return false;
        }

        return (
          distanceInKm(51.95042, 14.7143, event.coordinates.latitude, event.coordinates.longitude) <=
          maxDistance
        );
      });
    }

    return results;
  }

  private sortEvents(events: EventsContent["events"]["results"], filters: EventFilters) {
    if (filters.sortBy === "title") {
      events.sort(
        (left, right) => (filters.ordering === "desc" ? -1 : 1) * left.title.localeCompare(right.title),
      );
      return;
    }

    events.sort(
      (left, right) =>
        (filters.ordering === "desc" ? -1 : 1) *
        (new Date(left.startDate).getTime() - new Date(right.startDate).getTime()),
    );
  }
}
