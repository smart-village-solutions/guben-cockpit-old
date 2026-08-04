import type {
  BookingFaqsContent,
  BookingTenantsContent,
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
} from "../../../shared/public-content/contracts.js";
import type { EventFilters } from "./postgrest-content-types.js";

export const contentRepositoryContractModule = "content-repository-contract";

export type { EventFilters } from "./postgrest-content-types.js";

export interface PublicContentRepository {
  getHome(language: string): Promise<HomeContent>;
  getProjects(language: string, pageNumber: number, pageSize: number): Promise<ProjectsContent>;
  getFeaturedProjects(language: string): Promise<FeaturedProjectsContent>;
  getFeaturedProjectById(language: string, id: string): Promise<FeaturedProjectDetailContent>;
  getPois(language: string, filters: PoiFilters): Promise<PoisContent>;
  getPoiById(language: string, id: string): Promise<PoiDetailContent>;
  getPublicContent(language: string): Promise<PublicContentBundle>;
  getEvents(language: string, filters: EventFilters): Promise<EventsContent>;
  getEventById(language: string, id: string): Promise<EventDetailContent>;
  getDashboard(language: string): Promise<DashboardContent>;
  getMap(language: string): Promise<MapContent>;
  getFooter(): Promise<FooterContent>;
  getBookingTenants(): Promise<BookingTenantsContent>;
  getBookingFaqs(language: string): Promise<BookingFaqsContent>;
}
