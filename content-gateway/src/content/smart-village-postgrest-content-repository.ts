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
import type { EventFilters, PublicContentRepository } from "./content-repository-contract.js";
import type { PostgrestContentRepository } from "./postgrest-content-repository.js";
import type { SmartVillageEventRepository } from "./smart-village-event-repository.js";

type SmartVillagePostgrestContentRepositoryOptions = {
  postgrestRepository: PostgrestContentRepository;
  smartVillageEventRepository: SmartVillageEventRepository;
};

export class SmartVillagePostgrestContentRepository implements PublicContentRepository {
  public constructor(
    private readonly options: SmartVillagePostgrestContentRepositoryOptions,
  ) {}

  public getHome(language: string): Promise<HomeContent> {
    return this.options.postgrestRepository.getHome(language);
  }

  public getProjects(language: string, pageNumber: number, pageSize: number): Promise<ProjectsContent> {
    return this.options.postgrestRepository.getProjects(language, pageNumber, pageSize);
  }

  public getPublicContent(language: string): Promise<PublicContentBundle> {
    return this.options.postgrestRepository.getPublicContent(language);
  }

  public getEvents(language: string, filters: EventFilters): Promise<EventsContent> {
    return this.options.smartVillageEventRepository.getEvents(language, filters);
  }

  public getEventById(language: string, id: string): Promise<EventDetailContent> {
    return this.options.smartVillageEventRepository.getEventById(language, id);
  }

  public getDashboard(language: string): Promise<DashboardContent> {
    return this.options.postgrestRepository.getDashboard(language);
  }

  public getMap(language: string): Promise<MapContent> {
    return this.options.postgrestRepository.getMap(language);
  }

  public getFooter(): Promise<FooterContent> {
    return this.options.postgrestRepository.getFooter();
  }

  public getBookingTenants(): Promise<BookingTenantsContent> {
    return this.options.postgrestRepository.getBookingTenants();
  }
}
