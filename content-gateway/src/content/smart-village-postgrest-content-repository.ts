import type {
  BookingFaqsContent,
  BookingTenantsContent,
  DashboardContent,
  EventDetailContent,
  EventsContent,
  FooterContent,
  FeaturedProjectsContent,
  HomeContent,
  MapContent,
  ProjectsContent,
  PoiDetailContent,
  PoiFilters,
  PoisContent,
  PublicContentBundle,
} from "../../../shared/public-content/contracts.js";
import type { EventFilters, PublicContentRepository } from "./content-repository-contract.js";
import type { PostgrestContentRepository } from "./postgrest-content-repository.js";
import type { SmartVillageEventRepository } from "./smart-village-event-repository.js";
import type { SmartVillageBookingFaqRepository } from "./smart-village-booking-faq-repository.js";
import type { SmartVillageCockpitCardRepository } from "./smart-village-cockpit-card-repository.js";
import type { SmartVillagePoiRepository } from "./smart-village-poi-repository.js";
import {
  enrichDashboardWithCockpitCards,
  flattenedDashboardCards,
} from "./cockpit-card-dashboard-enrichment.js";

type SmartVillagePostgrestContentRepositoryOptions = {
  postgrestRepository: PostgrestContentRepository;
  smartVillageEventRepository: SmartVillageEventRepository;
  smartVillageBookingFaqRepository: SmartVillageBookingFaqRepository;
  smartVillageCockpitCardRepository: SmartVillageCockpitCardRepository;
  smartVillagePoiRepository: SmartVillagePoiRepository;
  warn?: (message: string, context: Record<string, unknown>) => void;
};

export class SmartVillagePostgrestContentRepository implements PublicContentRepository {
  public constructor(
    private readonly options: SmartVillagePostgrestContentRepositoryOptions,
  ) {}

  public async getHome(language: string): Promise<HomeContent> {
    const home = await this.options.postgrestRepository.getHome(language);
    const dashboard = await this.enrichDashboard(language, {
      dropdowns: home.dashboard.dropdowns,
      seo: home.seo,
    });
    return { ...home, dashboard: { dropdowns: dashboard.dropdowns } };
  }

  public getProjects(language: string, pageNumber: number, pageSize: number): Promise<ProjectsContent> {
    return this.options.postgrestRepository.getProjects(language, pageNumber, pageSize);
  }

  public getFeaturedProjects(language: string): Promise<FeaturedProjectsContent> {
    return this.options.postgrestRepository.getFeaturedProjects(language);
  }

  public getPois(language: string, filters: PoiFilters): Promise<PoisContent> {
    return this.options.smartVillagePoiRepository.getPois(language, filters);
  }

  public getPoiById(language: string, id: string): Promise<PoiDetailContent> {
    return this.options.smartVillagePoiRepository.getPoiById(language, id);
  }

  public async getPublicContent(language: string): Promise<PublicContentBundle> {
    const content = await this.options.postgrestRepository.getPublicContent(language);
    const dashboard = await this.enrichDashboard(language, {
      dropdowns: content.home.dropdowns,
      seo: content.home.page.seo,
    });
    return {
      ...content,
      home: {
        ...content.home,
        dropdowns: dashboard.dropdowns,
        cards: flattenedDashboardCards(dashboard.dropdowns),
      },
    };
  }

  public getEvents(language: string, filters: EventFilters): Promise<EventsContent> {
    return this.options.smartVillageEventRepository.getEvents(language, filters);
  }

  public getEventById(language: string, id: string): Promise<EventDetailContent> {
    return this.options.smartVillageEventRepository.getEventById(language, id);
  }

  public async getDashboard(language: string): Promise<DashboardContent> {
    const dashboard = await this.options.postgrestRepository.getDashboard(language);
    return this.enrichDashboard(language, dashboard);
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

  public getBookingFaqs(language: string): Promise<BookingFaqsContent> {
    return this.options.smartVillageBookingFaqRepository.getBookingFaqs(language);
  }

  private async enrichDashboard(language: string, dashboard: DashboardContent): Promise<DashboardContent> {
    try {
      const cards = await this.options.smartVillageCockpitCardRepository.getCockpitCards(language);
      const enriched = enrichDashboardWithCockpitCards(dashboard, cards, this.options.warn);
      if (!enriched.usedSmartVillageCards) {
        this.options.warn?.("Using local Cockpit Cards because Smart Village returned no assignable cards", {
          languageCode: language,
        });
      }
      return enriched.dashboard;
    } catch (error) {
      this.options.warn?.("Using local Cockpit Cards because Smart Village card loading failed", {
        languageCode: language,
        error: error instanceof Error ? error.message : String(error),
      });
      return dashboard;
    }
  }
}
