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

// Parse inside the promise so invalid mock data rejects through the repository contract.
export class MockContentRepository implements PublicContentRepository {
  public getHome(): Promise<HomeContent> {
    return Promise.resolve().then(() => homeContentSchema.parse(mockHomeContent));
  }

  public getProjects(): Promise<ProjectsContent> {
    return Promise.resolve().then(() => projectsContentSchema.parse(mockProjectsContent));
  }

  public getFeaturedProjects(): Promise<FeaturedProjectsContent> {
    return Promise.resolve().then(() => {
      const projects = projectsContentSchema.parse(mockProjectsContent);
      return featuredProjectsContentSchema.parse({
        page: projects.page,
        featuredProjects: projects.featuredProjects,
        seo: projects.seo,
      });
    });
  }

  public getFeaturedProjectById(_language: string, id: string): Promise<FeaturedProjectDetailContent> {
    return Promise.resolve().then(() => {
      const projects = projectsContentSchema.parse(mockProjectsContent);
      const project = projects.featuredProjects.find((entry) => entry.id === id);
      if (!project) throw new Error("Mock Featured Project not found");
      return featuredProjectDetailContentSchema.parse({ project, seo: projects.seo });
    });
  }

  public getPois(_language: string, filters: PoiFilters): Promise<PoisContent> {
    return Promise.resolve({
      pageNumber: filters.pageNumber,
      pageSize: filters.pageSize,
      totalCount: 0,
      pageCount: 1,
      results: [],
      categories: [],
      locations: [],
    });
  }

  public getPoiById(): Promise<PoiDetailContent> {
    return Promise.reject(new Error("Mock POI not found"));
  }

  public getPublicContent(): Promise<PublicContentBundle> {
    return Promise.resolve().then(() => publicContentBundleSchema.parse(mockPublicContentBundle));
  }

  public getEvents(): Promise<EventsContent> {
    return Promise.resolve().then(() => eventsContentSchema.parse(mockEventsContent));
  }

  public getEventById(): Promise<EventDetailContent> {
    return Promise.resolve().then(() => eventDetailContentSchema.parse(mockEventDetail));
  }

  public getDashboard(): Promise<DashboardContent> {
    return Promise.resolve().then(() => dashboardContentSchema.parse(mockDashboardContent));
  }

  public getMap(): Promise<MapContent> {
    return Promise.resolve().then(() => mapContentSchema.parse(mockMapContent));
  }

  public getFooter(): Promise<FooterContent> {
    return Promise.resolve().then(() => footerContentSchema.parse(mockFooterContent));
  }

  public getBookingTenants(): Promise<BookingTenantsContent> {
    return Promise.resolve().then(() => {
      return bookingTenantsContentSchema.parse({
        tenants: mockEventsContent.events.bookingTenants,
      });
    });
  }

  public getBookingFaqs(): Promise<BookingFaqsContent> {
    return Promise.resolve().then(() => bookingFaqsContentSchema.parse({ items: [] }));
  }
}

export class PostgrestContentRepository extends PostgrestRepository {
  public constructor(config: PostgrestConfig, client: ConstructorParameters<typeof PostgrestRepository>[1]) {
    super(config, client);
  }
}
