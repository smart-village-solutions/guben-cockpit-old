import {
  BookingTenantsContent,
  BookingFaqsContent,
  DashboardContent,
  EventDetailContent,
  EventsContent,
  FooterContent,
  HomeContent,
  MapContent,
  ProjectsContent,
  PublicContentBundle,
  bookingTenantsContentSchema,
  bookingFaqsContentSchema,
  dashboardContentSchema,
  eventDetailContentSchema,
  eventsContentSchema,
  footerContentSchema,
  homeContentSchema,
  mapContentSchema,
  projectsContentSchema,
  publicContentBundleSchema,
} from "../../../shared/public-content/contracts.js";
import { PostgrestConfig } from "../config.js";
import { mockDashboardContent, mockEventDetail, mockEventsContent, mockFooterContent, mockHomeContent, mockMapContent, mockProjectsContent, mockPublicContentBundle } from "./mock-data.js";
import { type PublicContentRepository } from "./content-repository-contract.js";
import { PostgrestContentRepository as PostgrestRepository } from "./postgrest-content-repository.js";

export type { EventFilters, PublicContentRepository } from "./content-repository-contract.js";
export { SmartVillagePostgrestContentRepository } from "./smart-village-postgrest-content-repository.js";

export class MockContentRepository implements PublicContentRepository {
  public async getHome(): Promise<HomeContent> {
    return homeContentSchema.parse(mockHomeContent);
  }

  public async getProjects(): Promise<ProjectsContent> {
    return projectsContentSchema.parse(mockProjectsContent);
  }

  public async getPublicContent(): Promise<PublicContentBundle> {
    return publicContentBundleSchema.parse(mockPublicContentBundle);
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

  public async getBookingFaqs(): Promise<BookingFaqsContent> {
    return bookingFaqsContentSchema.parse({ items: [] });
  }
}

export class PostgrestContentRepository extends PostgrestRepository {
  public constructor(config: PostgrestConfig, client: ConstructorParameters<typeof PostgrestRepository>[1]) {
    super(config, client);
  }
}
