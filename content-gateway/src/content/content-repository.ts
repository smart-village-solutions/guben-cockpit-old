import {
  BookingTenantsContent,
  DashboardContent,
  EventDetailContent,
  EventsContent,
  FooterContent,
  HomeContent,
  MapContent,
  ProjectsContent,
  bookingTenantsContentSchema,
  dashboardContentSchema,
  eventDetailContentSchema,
  eventsContentSchema,
  footerContentSchema,
  homeContentSchema,
  mapContentSchema,
  projectsContentSchema,
} from "../../../shared/public-content/contracts.js";
import { PostgrestConfig } from "../config.js";
import { mockDashboardContent, mockEventDetail, mockEventsContent, mockFooterContent, mockHomeContent, mockMapContent, mockProjectsContent } from "./mock-data.js";
import { PostgrestContentRepository as PostgrestRepository } from "./postgrest-content-repository.js";
import { EventFilters } from "./postgrest-content-types.js";

export type { EventFilters } from "./postgrest-content-types.js";
export { SmartVillagePostgrestContentRepository } from "./smart-village-postgrest-content-repository.js";

export interface PublicContentRepository {
  getHome(language: string): Promise<HomeContent>;
  getProjects(language: string, pageNumber: number, pageSize: number): Promise<ProjectsContent>;
  getEvents(language: string, filters: EventFilters): Promise<EventsContent>;
  getEventById(language: string, id: string): Promise<EventDetailContent>;
  getDashboard(language: string): Promise<DashboardContent>;
  getMap(language: string): Promise<MapContent>;
  getFooter(): Promise<FooterContent>;
  getBookingTenants(): Promise<BookingTenantsContent>;
}

export class MockContentRepository implements PublicContentRepository {
  public async getHome(): Promise<HomeContent> {
    return homeContentSchema.parse(mockHomeContent);
  }

  public async getProjects(): Promise<ProjectsContent> {
    return projectsContentSchema.parse(mockProjectsContent);
  }

  public async getEvents(): Promise<EventsContent> {
    return eventsContentSchema.parse(mockEventsContent);
  }

  public async getEventById(): Promise<EventDetailContent> {
    return eventDetailContentSchema.parse(mockEventDetail);
  }

  public async getDashboard(): Promise<DashboardContent> {
    return dashboardContentSchema.parse(mockDashboardContent);
  }

  public async getMap(): Promise<MapContent> {
    return mapContentSchema.parse(mockMapContent);
  }

  public async getFooter(): Promise<FooterContent> {
    return footerContentSchema.parse(mockFooterContent);
  }

  public async getBookingTenants(): Promise<BookingTenantsContent> {
    return bookingTenantsContentSchema.parse({
      tenants: mockEventsContent.events.bookingTenants,
    });
  }
}

export class PostgrestContentRepository extends PostgrestRepository {
  public constructor(config: PostgrestConfig, client: ConstructorParameters<typeof PostgrestRepository>[1]) {
    super(config, client);
  }
}
