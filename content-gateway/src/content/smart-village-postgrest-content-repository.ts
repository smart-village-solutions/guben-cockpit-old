import { mergeLanguageRecords } from "../translation/merge-language-records.js";
import { AutomaticTranslator } from "../translation/automatic-translator.js";
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
import { featuredProjectsContentSchema } from "../../../shared/public-content/contracts.js";
import type { EventFilters, PublicContentRepository } from "./content-repository-contract.js";
import type { PostgrestContentRepository } from "./postgrest-content-repository.js";
import type { SmartVillageEventRepository } from "./smart-village-event-repository.js";
import type { SmartVillageBookingFaqRepository } from "./smart-village-booking-faq-repository.js";
import type { SmartVillageCockpitCardRepository } from "./smart-village-cockpit-card-repository.js";
import type { SmartVillagePoiRepository } from "./smart-village-poi-repository.js";
import type { SmartVillageFeaturedProjectRepository } from "./smart-village-featured-project-repository.js";
import {
  enrichDashboardWithCockpitCards,
  flattenedDashboardCards,
} from "./cockpit-card-dashboard-enrichment.js";

type SmartVillagePostgrestContentRepositoryOptions = {
  translator?: AutomaticTranslator;
  postgrestRepository: PostgrestContentRepository;
  smartVillageEventRepository: SmartVillageEventRepository;
  smartVillageBookingFaqRepository: SmartVillageBookingFaqRepository;
  smartVillageCockpitCardRepository: SmartVillageCockpitCardRepository;
  smartVillagePoiRepository: SmartVillagePoiRepository;
  smartVillageFeaturedProjectRepository: SmartVillageFeaturedProjectRepository;
  warn?: (message: string, context: Record<string, unknown>) => void;
};

export class SmartVillagePostgrestContentRepository implements PublicContentRepository {
  private readonly translator: AutomaticTranslator;

  public constructor(
    private readonly options: SmartVillagePostgrestContentRepositoryOptions,
  ) { this.translator = options.translator ?? new AutomaticTranslator({}); }

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

  public async getFeaturedProjects(language: string): Promise<FeaturedProjectsContent> {
    const [metadata, featuredProjects] = await Promise.all([
      this.options.postgrestRepository.getFeaturedProjectsMetadata(language),
      this.options.smartVillageFeaturedProjectRepository.getFeaturedProjects(language).then((content) => this.translator.content(content, language, true)),
    ]);
    return featuredProjectsContentSchema.parse({ ...metadata, featuredProjects });
  }

  public getFeaturedProjectById(language: string, id: string): Promise<FeaturedProjectDetailContent> {
    return this.options.smartVillageFeaturedProjectRepository.getFeaturedProjectById(language, id).then((content) => this.translator.content(content, language, true));
  }

  public getPois(language: string, filters: PoiFilters): Promise<PoisContent> {
    return this.options.smartVillagePoiRepository.getPois(language, filters).then((content) => this.translator.content(content, language, true));
  }

  public getPoiById(language: string, id: string): Promise<PoiDetailContent> {
    return this.options.smartVillagePoiRepository.getPoiById(language, id).then((content) => this.translator.content(content, language, true));
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
    return this.options.smartVillageEventRepository.getEvents(language, filters).then(async (content) => ({
      ...content, events: await this.translator.content(content.events, language),
    }));
  }

  public getEventById(language: string, id: string): Promise<EventDetailContent> {
    return this.options.smartVillageEventRepository.getEventById(language, id).then((content) => this.translator.content(content, language));
  }

  public async getDashboard(language: string): Promise<DashboardContent> {
    const dashboard = await this.options.postgrestRepository.getDashboard(language);
    return this.enrichDashboard(language, dashboard);
  }

  public getMap(language: string): Promise<MapContent> {
    return this.options.postgrestRepository.getMap(language);
  }

  public getFooter(language?: string): Promise<FooterContent> {
    return this.options.postgrestRepository.getFooter(language);
  }

  public getBookingTenants(): Promise<BookingTenantsContent> {
    return this.options.postgrestRepository.getBookingTenants();
  }

  public async getBookingFaqs(language: string): Promise<BookingFaqsContent> {
    const content = await this.options.smartVillageBookingFaqRepository.getBookingFaqs(language);
    if (language === "de") return content;
    const original = await this.options.smartVillageBookingFaqRepository.getBookingFaqs("de").catch(() => ({ items: [] }));
    const translate = async (item: typeof original.items[number]) => ({
      ...await this.translator.content(item, language), languageCode: language,
    });
    const items = content.items.length === 0 ? await Promise.all(original.items.map(translate)) : await mergeLanguageRecords({
      source: original.items, target: content.items, key: (item) => item.translationKey,
      translate, fill: (source, target) => this.translator.fillMissing(source, target, language),
    });
    return { items: items.sort((left, right) => right.sortWeight - left.sortWeight) };
  }

  private async enrichDashboard(language: string, dashboard: DashboardContent): Promise<DashboardContent> {
    try {
      let cards = await this.options.smartVillageCockpitCardRepository.getCockpitCards(language);
      if (language !== "de") {
        const original = await this.options.smartVillageCockpitCardRepository.getCockpitCards("de").catch(() => []);
        const key = (entry: typeof cards[number]) => entry.translationKey
          ? `key:${entry.translationKey}` : entry.card.button?.url ? `url:${entry.categoryName}:${entry.card.button.url}` : undefined;
        const categories = new Set(cards.map((entry) => entry.categoryName));
        const missingCategories = original.filter((entry) => !categories.has(entry.categoryName));
        cards = await mergeLanguageRecords({
          source: original.filter((entry) => categories.has(entry.categoryName)), target: cards, key,
          translate: (entry) => this.translator.content(entry, language),
          fill: (source, target) => this.translator.fillMissing(source, target, language),
        });
        cards.push(...await this.translator.content(missingCategories, language));
        // Match against canonical German tab names, then use localized labels for rendering.
        const canonical = await this.options.postgrestRepository.getDashboard("de").catch(() => dashboard);
        const tabTitles = new Map(dashboard.dropdowns.flatMap((dropdown) => dropdown.tabs.map((tab) => [tab.id, tab.title])));
        const localizedCategories = new Map(canonical.dropdowns.flatMap((dropdown) => dropdown.tabs.map((tab) => [tab.title, tabTitles.get(tab.id) ?? tab.title])));
        cards = cards.map((entry) => ({ ...entry, categoryName: localizedCategories.get(entry.categoryName) ?? entry.categoryName }));
      }
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
