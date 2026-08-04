import {
  BookingTenantsContent,
  BookingFaqsContent,
  DashboardContent,
  EventDetailContent,
  EventsContent,
  FooterContent,
  FeaturedProjectsContent,
  FeaturedProjectDetailContent,
  HomeContent,
  MapContent,
  ProjectsContent,
  PoiDetailContent,
  PoiFilters,
  PoisContent,
  PublicContentBundle,
  bookingTenantsContentSchema,
  bookingFaqsContentSchema,
  dashboardContentSchema,
  eventDetailContentSchema,
  eventsContentSchema,
  footerContentSchema,
  featuredProjectsContentSchema,
  featuredProjectDetailContentSchema,
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

  public async getFeaturedProjects(): Promise<FeaturedProjectsContent> {
    const projects = projectsContentSchema.parse(mockProjectsContent);
    return featuredProjectsContentSchema.parse({
      page: projects.page,
      featuredProjects: projects.featuredProjects,
      seo: projects.seo,
    });
  }

  public async getFeaturedProjectById(_language: string, id: string): Promise<FeaturedProjectDetailContent> {
    const projects = projectsContentSchema.parse(mockProjectsContent);
    const project = projects.featuredProjects.find((entry) => entry.id === id);
    if (!project) throw new Error("Mock Featured Project not found");
    return featuredProjectDetailContentSchema.parse({ project, seo: projects.seo });
  }

  public async getPois(_language: string, filters: PoiFilters): Promise<PoisContent> {
    return {
      pageNumber: filters.pageNumber,
      pageSize: filters.pageSize,
      totalCount: 0,
      pageCount: 1,
      results: [],
      categories: [],
      locations: [],
    };
  }

  public async getPoiById(): Promise<PoiDetailContent> {
    throw new Error("Mock POI not found");
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
