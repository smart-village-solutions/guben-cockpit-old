import { describe, expect, it, vi } from "vitest";

import {
  eventDetailContentSchema,
  eventsContentSchema,
  publicContentBundleSchema,
} from "../../shared/public-content/contracts.js";

import {
  MockContentRepository,
  PostgrestContentRepository,
  SmartVillagePostgrestContentRepository,
} from "../src/content/content-repository.js";
import { contentRepositoryContractModule } from "../src/content/content-repository-contract.js";
import type { EventFilters, PublicContentRepository } from "../src/content/content-repository-contract.js";
import {
  mockDashboardContent,
  mockEventDetail,
  mockEventsContent,
  mockFooterContent,
  mockHomeContent,
  mockMapContent,
  mockPublicContentBundle,
  mockProjectsContent,
} from "../src/content/mock-data.js";
import type { PostgrestConfig } from "../src/config.js";

const config: PostgrestConfig = {
  PORT: 5100,
  LOG_LEVEL: "silent",
  PUBLIC_BASE_URL: "http://localhost:3000",
  CONTENT_SOURCE_MODE: "postgrest",
  DEFAULT_LANGUAGE: "de",
  FALLBACK_LANGUAGE: "de",
  SV_GRAPHQL_URL: "https://smart-village.example.com/graphql",
  SV_OAUTH_TOKEN_URL: "https://smart-village.example.com/oauth/token",
  SV_CLIENT_ID: "test-client-id",
  SV_CLIENT_SECRET: "test-client-secret",
  POSTGREST_URL: "http://postgrest",
  POSTGREST_TIMEOUT_MS: 100,
  POSTGREST_SCHEMA: "public_content",
};

describe("content repository glue", () => {
  it("exposes repository contracts from a dedicated module", () => {
    const filters: EventFilters = {
      pageNumber: 1,
      pageSize: 10,
      sortBy: "startDate",
      ordering: "asc",
    };
    const repository = {
      getHome: async () => mockHomeContent,
      getProjects: async () => mockProjectsContent,
      getFeaturedProjects: async () => ({ page: mockProjectsContent.page, featuredProjects: mockProjectsContent.featuredProjects, seo: mockProjectsContent.seo }),
      getFeaturedProjectById: async () => ({ project: mockProjectsContent.featuredProjects[0]!, seo: mockProjectsContent.seo }),
      getPois: async (_language: string, poiFilters: import("../../shared/public-content/contracts.js").PoiFilters) => ({ pageNumber: poiFilters.pageNumber, pageSize: poiFilters.pageSize, totalCount: 0, pageCount: 1, results: [], categories: [], locations: [] }),
      getPoiById: async () => { throw new Error("not found"); },
      getPublicContent: async () => mockPublicContentBundle,
      getEvents: async () => mockEventsContent,
      getEventById: async () => mockEventDetail,
      getDashboard: async () => mockDashboardContent,
      getMap: async () => mockMapContent,
      getFooter: async () => mockFooterContent,
      getBookingTenants: async () => ({
        tenants: mockEventsContent.events.bookingTenants,
      }),
      getBookingFaqs: async () => ({ items: [] }),
    } satisfies PublicContentRepository;

    expect(filters).toMatchObject({
      pageNumber: 1,
      ordering: "asc",
    });
    expect(contentRepositoryContractModule).toBe("content-repository-contract");
    expect(typeof repository.getEvents).toBe("function");
  });

  it("parses the mock repository payloads against the shared schemas", async () => {
    const repository = new MockContentRepository();

    await expect(repository.getHome()).resolves.toEqual(mockHomeContent);
    await expect(repository.getProjects()).resolves.toEqual(mockProjectsContent);
    await expect(repository.getPublicContent()).resolves.toEqual(mockPublicContentBundle);
    await expect(repository.getEvents()).resolves.toEqual(mockEventsContent);
    await expect(repository.getDashboard()).resolves.toEqual(mockDashboardContent);
    await expect(repository.getMap()).resolves.toEqual(mockMapContent);
    await expect(repository.getFooter()).resolves.toEqual(mockFooterContent);
    await expect(repository.getBookingTenants()).resolves.toEqual({
      tenants: mockEventsContent.events.bookingTenants,
    });
    await expect(repository.getBookingFaqs()).resolves.toEqual({ items: [] });
  });

  it("keeps the exported PostgrestContentRepository alias wired to the legacy PostgREST implementation", () => {
    const repository = new PostgrestContentRepository(config, {
      select: async () => [],
    } as never);

    expect(repository).toBeInstanceOf(PostgrestContentRepository);
    expect(typeof repository.getHome).toBe("function");
    expect(typeof repository.getEvents).toBe("function");
  });

  it("routes runtime event reads through Smart Village while keeping the wrapper outputs contract-shaped", async () => {
    const filters = {
      pageNumber: 1,
      pageSize: 25,
      title: "Frühlingsmarkt",
      category: mockEventsContent.events.categories[0]?.id,
      startDate: "2026-04-01T00:00:00.000Z",
      endDate: "2026-04-30T23:59:59.000Z",
      sortBy: "startDate",
      ordering: "asc",
      distance: 25,
    };
    const postgrestRepository = {
      getHome: vi.fn(async () => mockHomeContent),
      getProjects: vi.fn(async () => mockProjectsContent),
      getFeaturedProjectsMetadata: vi.fn(async () => ({ page: mockProjectsContent.page, seo: mockProjectsContent.seo })),
      getPublicContent: vi.fn(async () => mockPublicContentBundle),
      getDashboard: vi.fn(async () => mockDashboardContent),
      getMap: vi.fn(async () => mockMapContent),
      getFooter: vi.fn(async () => mockFooterContent),
      getBookingTenants: vi.fn(async () => ({
        tenants: mockEventsContent.events.bookingTenants,
      })),
    };
    const smartVillageEventRepository = {
      getEvents: vi.fn(async () => mockEventsContent),
      getEventById: vi.fn(async () => mockEventDetail),
    };
    const smartVillageBookingFaqRepository = {
      getBookingFaqs: vi.fn(async () => ({ items: [] })),
    };
    const smartVillageCockpitCardRepository = {
      getCockpitCards: vi.fn(async () => []),
    };
    const smartVillagePoiRepository = {
      getPois: vi.fn(async (_language, poiFilters) => ({ pageNumber: poiFilters.pageNumber, pageSize: poiFilters.pageSize, totalCount: 0, pageCount: 1, results: [], categories: [], locations: [] })),
      getPoiById: vi.fn(async () => { throw new Error("not found"); }),
    };
    const smartVillageFeaturedProjectRepository = {
      getFeaturedProjects: vi.fn(async () => mockProjectsContent.featuredProjects),
      getFeaturedProjectById: vi.fn(async () => ({ project: mockProjectsContent.featuredProjects[0]!, seo: mockProjectsContent.seo })),
    };
    const repository = new SmartVillagePostgrestContentRepository({
      postgrestRepository: postgrestRepository as never,
      smartVillageEventRepository: smartVillageEventRepository as never,
      smartVillageBookingFaqRepository: smartVillageBookingFaqRepository as never,
      smartVillageCockpitCardRepository: smartVillageCockpitCardRepository as never,
      smartVillagePoiRepository: smartVillagePoiRepository as never,
      smartVillageFeaturedProjectRepository: smartVillageFeaturedProjectRepository as never,
    });
    const home = await repository.getHome("de");
    const projects = await repository.getProjects("de", 1, 12);
    const featuredProjects = await repository.getFeaturedProjects("de");
    const featuredProjectDetail = await repository.getFeaturedProjectById("de", mockProjectsContent.featuredProjects[0]!.id);
    const publicContent = await repository.getPublicContent("de");
    const events = await repository.getEvents("de", filters);
    const eventDetail = await repository.getEventById("de", mockEventDetail.event.id);
    const dashboard = await repository.getDashboard("de");
    const map = await repository.getMap("de");
    const footer = await repository.getFooter();
    const bookingTenants = await repository.getBookingTenants();

    expect(home).toEqual(mockHomeContent);
    expect(projects).toEqual(mockProjectsContent);
    expect(featuredProjects).toEqual({ page: mockProjectsContent.page, featuredProjects: mockProjectsContent.featuredProjects, seo: mockProjectsContent.seo });
    expect(featuredProjectDetail.project).toEqual(mockProjectsContent.featuredProjects[0]);
    expect(publicContent).toEqual(publicContentBundleSchema.parse(mockPublicContentBundle));
    expect(events).toEqual(eventsContentSchema.parse(mockEventsContent));
    expect(eventDetail).toEqual(eventDetailContentSchema.parse(mockEventDetail));
    expect(dashboard).toEqual(mockDashboardContent);
    expect(map).toEqual(mockMapContent);
    expect(footer).toEqual(mockFooterContent);
    expect(bookingTenants).toEqual({
      tenants: mockEventsContent.events.bookingTenants,
    });

    expect(postgrestRepository.getHome).toHaveBeenCalledWith("de");
    expect(postgrestRepository.getProjects).toHaveBeenCalledWith("de", 1, 12);
    expect(postgrestRepository.getFeaturedProjectsMetadata).toHaveBeenCalledWith("de");
    expect(smartVillageFeaturedProjectRepository.getFeaturedProjects).toHaveBeenCalledWith("de");
    expect(smartVillageFeaturedProjectRepository.getFeaturedProjectById).toHaveBeenCalledWith("de", mockProjectsContent.featuredProjects[0]!.id);
    expect(postgrestRepository.getPublicContent).toHaveBeenCalledWith("de");
    expect(smartVillageEventRepository.getEvents).toHaveBeenCalledWith("de", filters);
    expect(smartVillageEventRepository.getEventById).toHaveBeenCalledWith("de", mockEventDetail.event.id);
    expect(postgrestRepository.getDashboard).toHaveBeenCalledWith("de");
    expect(postgrestRepository.getMap).toHaveBeenCalledWith("de");
    expect(postgrestRepository.getFooter).toHaveBeenCalledWith();
    expect(postgrestRepository.getBookingTenants).toHaveBeenCalledWith();
    expect(smartVillageCockpitCardRepository.getCockpitCards).toHaveBeenCalledTimes(3);
    expect(events).toMatchObject({
      events: {
        results: [
          {
            id: mockEventsContent.events.results[0]?.id,
            eventId: mockEventsContent.events.results[0]?.eventId,
            terminId: mockEventsContent.events.results[0]?.terminId,
          },
        ],
      },
    });
  });

  it("uses matching Smart Village cards consistently for home, dashboard, and public content", async () => {
    const tab = mockDashboardContent.dropdowns[0]!.tabs[0]!;
    const apiCard = {
      categoryName: ` ${tab.title.toUpperCase()} `,
      languageCode: "de",
      sortWeight: 0,
      card: {
        id: "api-card",
        title: "API-Kachel",
        description: null,
        imageUrl: null,
        imageAlt: null,
        button: null,
      },
    };
    const postgrestRepository = {
      getHome: vi.fn(async () => structuredClone(mockHomeContent)),
      getProjects: vi.fn(async () => mockProjectsContent),
      getPublicContent: vi.fn(async () => structuredClone(mockPublicContentBundle)),
      getDashboard: vi.fn(async () => structuredClone(mockDashboardContent)),
      getMap: vi.fn(async () => mockMapContent),
      getFooter: vi.fn(async () => mockFooterContent),
      getBookingTenants: vi.fn(async () => ({ tenants: [] })),
    };
    const repository = new SmartVillagePostgrestContentRepository({
      postgrestRepository: postgrestRepository as never,
      smartVillageEventRepository: {} as never,
      smartVillageBookingFaqRepository: {} as never,
      smartVillageCockpitCardRepository: {
        getCockpitCards: vi.fn(async () => [apiCard]),
      } as never,
      smartVillagePoiRepository: {} as never,
      smartVillageFeaturedProjectRepository: {} as never,
    });

    const [home, dashboard, publicContent] = await Promise.all([
      repository.getHome("de"),
      repository.getDashboard("de"),
      repository.getPublicContent("de"),
    ]);

    expect(home.dashboard.dropdowns[0]!.tabs[0]!.informationCards).toEqual([apiCard.card]);
    expect(dashboard.dropdowns[0]!.tabs[0]!.informationCards).toEqual([apiCard.card]);
    expect(publicContent.home.dropdowns[0]!.tabs[0]!.informationCards).toEqual([apiCard.card]);
    expect(publicContent.home.cards).toEqual([
      expect.objectContaining({ id: "api-card", tabId: tab.id, sequence: 1 }),
    ]);
  });

  it("does not fall back to PostgREST project rows when Featured Projects fail", async () => {
    const getProjects = vi.fn(async () => mockProjectsContent);
    const repository = new SmartVillagePostgrestContentRepository({
      postgrestRepository: {
        getFeaturedProjectsMetadata: vi.fn(async () => ({ page: mockProjectsContent.page, seo: mockProjectsContent.seo })),
        getProjects,
      } as never,
      smartVillageEventRepository: {} as never,
      smartVillageBookingFaqRepository: {} as never,
      smartVillageCockpitCardRepository: {} as never,
      smartVillagePoiRepository: {} as never,
      smartVillageFeaturedProjectRepository: {
        getFeaturedProjects: vi.fn(async () => { throw new Error("mainserver unavailable"); }),
      } as never,
    });

    await expect(repository.getFeaturedProjects("de")).rejects.toThrow("mainserver unavailable");
    expect(getProjects).not.toHaveBeenCalled();
  });

  it("keeps all local cards when Smart Village card loading fails", async () => {
    const warn = vi.fn();
    const repository = new SmartVillagePostgrestContentRepository({
      postgrestRepository: {
        getDashboard: vi.fn(async () => structuredClone(mockDashboardContent)),
      } as never,
      smartVillageEventRepository: {} as never,
      smartVillageBookingFaqRepository: {} as never,
      smartVillageCockpitCardRepository: {
        getCockpitCards: vi.fn(async () => {
          throw new Error("upstream unavailable");
        }),
      } as never,
      smartVillagePoiRepository: {} as never,
      smartVillageFeaturedProjectRepository: {} as never,
      warn,
    });

    await expect(repository.getDashboard("de")).resolves.toEqual(mockDashboardContent);
    expect(warn).toHaveBeenCalledWith(
      "Using local Cockpit Cards because Smart Village card loading failed",
      expect.objectContaining({ languageCode: "de", error: "upstream unavailable" }),
    );
  });
});
