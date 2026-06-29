import type {
  BookingTenantsContent,
  DashboardContent,
  EventDetailContent,
  EventsContent,
  FooterContent,
  HomeContent,
  MapContent,
  ProjectsContent,
  PublicContentBundle,
} from "../../../shared/public-content/contracts.js";
import type { EventFilters } from "./postgrest-content-types.js";

export const contentRepositoryContractModule = "content-repository-contract";

export type { EventFilters } from "./postgrest-content-types.js";

export interface PublicContentRepository {
  getHome(language: string): Promise<HomeContent>;
  getProjects(language: string, pageNumber: number, pageSize: number): Promise<ProjectsContent>;
  getPublicContent(language: string): Promise<PublicContentBundle>;
  getEvents(language: string, filters: EventFilters): Promise<EventsContent>;
  getEventById(language: string, id: string): Promise<EventDetailContent>;
  getDashboard(language: string): Promise<DashboardContent>;
  getMap(language: string): Promise<MapContent>;
  getFooter(): Promise<FooterContent>;
  getBookingTenants(): Promise<BookingTenantsContent>;
}
