import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createApp } from "../src/app.js";
import { GatewayError } from "../src/errors.js";
import { SmartVillageBookingFaqRepository } from "../src/content/smart-village-booking-faq-repository.js";
import { SmartVillageGraphQLClient } from "../src/upstream/smart-village-graphql-client.js";
import type { PublicContentRepository } from "../src/content/content-repository-contract.js";
import { loadConfig } from "../src/config.js";
import { mockDashboardContent, mockEventDetail, mockEventsContent, mockFooterContent, mockHomeContent, mockMapContent, mockProjectsContent, mockPublicContentBundle } from "../src/content/mock-data.js";

const baseConfig = loadConfig({
  PORT: "5100",
  LOG_LEVEL: "silent",
  PUBLIC_BASE_URL: "http://localhost:3000",
  CONTENT_SOURCE_MODE: "mock",
  DEFAULT_LANGUAGE: "de",
  FALLBACK_LANGUAGE: "de",
});

const repositoryStub = (): PublicContentRepository => ({
  getHome: vi.fn(async () => mockHomeContent),
  getProjects: vi.fn(async () => mockProjectsContent),
  getFeaturedProjects: vi.fn(async () => ({ page: mockProjectsContent.page, featuredProjects: mockProjectsContent.featuredProjects, seo: mockProjectsContent.seo })),
  getFeaturedProjectById: vi.fn(async (_language, id) => ({
    project: { ...mockProjectsContent.featuredProjects[0]!, id },
    seo: mockProjectsContent.seo,
  })),
  getPois: vi.fn(async (_language, filters) => ({ pageNumber: filters.pageNumber, pageSize: filters.pageSize, totalCount: 0, pageCount: 1, results: [], categories: [], locations: [] })),
  getPoiById: vi.fn(async () => { throw new GatewayError({ code: "NOT_FOUND", message: "not found", statusCode: 404, upstream: "gateway", retryable: false }); }),
  getPublicContent: vi.fn(async () => mockPublicContentBundle),
  getEvents: vi.fn(async () => mockEventsContent),
  getEventById: vi.fn(async () => mockEventDetail),
  getBookingTenants: vi.fn(async () => ({
    tenants: mockEventsContent.events.bookingTenants,
  })),
  getBookingFaqs: vi.fn(async () => ({ items: [] })),
  getDashboard: vi.fn(async () => mockDashboardContent),
  getMap: vi.fn(async () => mockMapContent),
  getFooter: vi.fn(async () => mockFooterContent),
});

describe("content gateway", () => {
  let repository: PublicContentRepository;
  const apps: Array<ReturnType<typeof createApp>> = [];

  const createTestApp = () => {
    const app = createApp({ config: baseConfig, repository });
    apps.push(app);
    return app;
  };

  beforeEach(() => {
    repository = repositoryStub();
  });

  afterEach(async () => {
    while (apps.length > 0) {
      const app = apps.pop();
      await app?.close();
    }
    vi.restoreAllMocks();
  });

  it("preserves the booking FAQ route contract when the GraphQL client serves stale data", async () => {
    let now = 0;
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce({
        ok: true,
        json: vi.fn(async () => ({ data: { genericItems: [{
          id: "faq-1",
          title: "Frage",
          genericType: "FAQ",
          payload: { languageCode: "de", sortWeight: 1 },
          contentBlocks: [{ body: "Antwort" }],
        }] } })),
      } as unknown as Response)
      .mockRejectedValue(new Error("upstream down"));
    const client = new SmartVillageGraphQLClient({
      graphqlUrl: "https://example.com/graphql",
      oauthClient: { getAccessToken: vi.fn(async () => "token-1") },
      retryAttempts: 0,
      readCacheOptions: { freshMs: 10, staleMs: 100, now: () => now },
    });
    const faqRepository = new SmartVillageBookingFaqRepository({ client });
    repository.getBookingFaqs = faqRepository.getBookingFaqs.bind(faqRepository);
    const app = createTestApp();

    const fresh = await app.inject({ method: "GET", url: "/api/content/booking/faqs?lang=de" });
    now = 10;
    const stale = await app.inject({ method: "GET", url: "/api/content/booking/faqs?lang=de" });

    expect(fresh.statusCode).toBe(200);
    expect(stale.statusCode).toBe(200);
    expect(stale.json()).toEqual(fresh.json());
    expect(stale.json()).toEqual({ items: [{
      id: "faq-1",
      question: "Frage",
      answer: "Antwort",
      languageCode: "de",
      sortWeight: 1,
    }] });
  });

  it("serves health, home and dashboard endpoints", async () => {
    const app = createTestApp();

    const healthResponse = await app.inject({
      method: "GET",
      url: "/health",
    });
    expect(healthResponse.statusCode).toBe(200);

    const homeResponse = await app.inject({
      method: "GET",
      url: "/api/content/home",
    });
    expect(homeResponse.statusCode).toBe(200);
    expect(homeResponse.json().page.title).toBe("Willkommen in Guben");

    const dashboardResponse = await app.inject({
      method: "GET",
      url: "/api/content/dashboard",
    });
    expect(dashboardResponse.statusCode).toBe(200);
    expect(dashboardResponse.json().dropdowns).toHaveLength(2);
  }, 15_000);

  it("serves projects and event content endpoints", async () => {
    const app = createTestApp();

    const projectsResponse = await app.inject({
      method: "GET",
      url: "/api/content/projects?pageNumber=1&pageSize=12",
    });
    expect(projectsResponse.statusCode).toBe(200);
    expect(projectsResponse.json().businesses.results).toHaveLength(1);

    const eventsResponse = await app.inject({
      method: "GET",
      url: "/api/content/events?pageNumber=1&pageSize=25",
    });
    expect(eventsResponse.statusCode).toBe(200);
    expect(eventsResponse.json().events.bookingTenants).toHaveLength(1);

    const eventDetailResponse = await app.inject({
      method: "GET",
      url: "/api/content/events/9c77a613-6085-41fc-baa7-68a5ec8b4a07",
    });
    expect(eventDetailResponse.statusCode).toBe(200);
    expect(eventDetailResponse.json().event.title).toBe("Frühlingsmarkt");
  });

  it("serves Featured Projects and strictly validated POI list/detail endpoints", async () => {
    const poi = {
      id: "poi:1",
      title: "Schule",
      description: "Beschreibung",
      imageUrl: null,
      updatedAt: null,
      categories: [{ id: "6186", name: "Schulen", parentId: null, parentName: null }],
      locationValue: "guben",
      locationLabel: "Guben",
      coordinates: null,
      media: [],
      address: null,
      contact: null,
      webUrls: [],
      openingHours: [],
      operatingCompany: null,
      dataProvider: null,
    };
    vi.mocked(repository.getPois).mockImplementation(async (_language, filters) => ({
      pageNumber: filters.pageNumber,
      pageSize: filters.pageSize,
      totalCount: 1,
      pageCount: 1,
      results: [poi],
      categories: poi.categories,
      locations: [{ value: "guben", label: "Guben" }],
    }));
    vi.mocked(repository.getPoiById).mockResolvedValue({
      poi,
      seo: { title: poi.title, description: poi.description, canonical: "http://localhost:3000/projects/poi", indexable: true },
    });
    const app = createTestApp();

    const featured = await app.inject({ method: "GET", url: "/api/content/featured-projects?lang=de" });
    expect(featured.statusCode).toBe(200);

    const featuredDetail = await app.inject({ method: "GET", url: "/api/content/featured-projects/513?lang=pl" });
    expect(featuredDetail.statusCode).toBe(200);
    expect(repository.getFeaturedProjectById).toHaveBeenCalledWith("pl", "513");

    const list = await app.inject({ method: "GET", url: "/api/content/pois?categoryIds=6186,%206187&sort=updatedAt&direction=desc&pageNumber=2&pageSize=5" });
    expect(list.statusCode).toBe(200);
    expect(repository.getPois).toHaveBeenCalledWith("de", expect.objectContaining({ categoryIds: ["6186", "6187"], direction: "desc", pageNumber: 2, pageSize: 5 }));

    const detail = await app.inject({ method: "GET", url: "/api/content/pois/poi%3A1" });
    expect(detail.statusCode).toBe(200);
    expect(repository.getPoiById).toHaveBeenCalledWith("de", "poi:1");

    const invalid = await app.inject({ method: "GET", url: "/api/content/pois?onlyWithImage=true" });
    expect(invalid.statusCode).toBe(500);
    const radius = await app.inject({ method: "GET", url: "/api/content/pois?radius=10" });
    expect(radius.statusCode).toBe(200);
    expect(repository.getPois).toHaveBeenLastCalledWith("de", expect.objectContaining({ radius: 10 }));
    expect(repository.getPois).toHaveBeenCalledTimes(2);
  });

  it("serves booking, map and footer endpoints", async () => {
    const app = createTestApp();

    const bookingTenantsResponse = await app.inject({
      method: "GET",
      url: "/api/content/booking-tenants",
    });
    expect(bookingTenantsResponse.statusCode).toBe(200);
    expect(bookingTenantsResponse.json().tenants).toHaveLength(1);

    const mapResponse = await app.inject({
      method: "GET",
      url: "/api/content/map",
    });
    expect(mapResponse.statusCode).toBe(200);
    expect(mapResponse.json().map.embedUrl).toContain("public.buildplace.io");

    const footerResponse = await app.inject({
      method: "GET",
      url: "/api/content/footer",
    });
    expect(footerResponse.statusCode).toBe(200);
    expect(footerResponse.json().items).toHaveLength(3);
  });

  it("serves Booking FAQs using explicit and header-derived languages", async () => {
    const app = createTestApp();
    vi.mocked(repository.getBookingFaqs).mockResolvedValue({
      items: [{ id: "faq-1", question: "Frage", answer: "Antwort", languageCode: "pl", sortWeight: 1 }],
    });

    const explicit = await app.inject({ method: "GET", url: "/api/content/booking/faqs?lang=pl" });
    const header = await app.inject({
      method: "GET",
      url: "/api/content/booking/faqs",
      headers: { "accept-language": "en-GB,en;q=0.8" },
    });

    expect(explicit.statusCode).toBe(200);
    expect(explicit.json().items[0].id).toBe("faq-1");
    expect(repository.getBookingFaqs).toHaveBeenNthCalledWith(1, "pl");
    expect(repository.getBookingFaqs).toHaveBeenNthCalledWith(2, "en");
    expect(header.statusCode).toBe(200);
  });

  it("falls back to the default language for wildcard and invalid language values", async () => {
    const app = createTestApp();

    const wildcardHeader = await app.inject({
      method: "GET",
      url: "/api/content/events?pageNumber=1&pageSize=25",
      headers: { "accept-language": "*" },
    });
    const invalidExplicitLanguage = await app.inject({
      method: "GET",
      url: "/api/content/events?lang=1%40&pageNumber=1&pageSize=25",
    });

    expect(wildcardHeader.statusCode).toBe(200);
    expect(invalidExplicitLanguage.statusCode).toBe(200);
    expect(repository.getEvents).toHaveBeenNthCalledWith(1, "de", expect.any(Object));
    expect(repository.getEvents).toHaveBeenNthCalledWith(2, "de", expect.any(Object));
  });

  it("returns empty FAQ collections and deterministic upstream errors", async () => {
    const app = createTestApp();
    await expect(app.inject({ method: "GET", url: "/api/content/booking/faqs" })).resolves.toMatchObject({ statusCode: 200 });

    vi.mocked(repository.getBookingFaqs).mockRejectedValueOnce(new GatewayError({
      code: "INVALID_UPSTREAM_PAYLOAD",
      message: "invalid FAQs",
      statusCode: 502,
      upstream: "smartvillage",
      retryable: false,
    }));
    const failure = await app.inject({ method: "GET", url: "/api/content/booking/faqs" });
    expect(failure.statusCode).toBe(502);
    expect(failure.json().error).toMatchObject({ code: "INVALID_UPSTREAM_PAYLOAD", upstream: "smartvillage" });
  });

  it("serves the bundled public content endpoint", async () => {
    const app = createTestApp();

    const response = await app.inject({
      method: "GET",
      url: "/api/content/public",
      headers: {
        "accept-language": "en-GB,en;q=0.8",
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().home.cards).toHaveLength(1);
    expect(response.json().projects.items).toHaveLength(3);
    expect(repository.getPublicContent).toHaveBeenCalledWith("en");
  });

  it("routes event list and detail requests through the PublicContentRepository contract", async () => {
    const app = createTestApp();

    const listResponse = await app.inject({
      method: "GET",
      url: "/api/content/events?pageNumber=2&pageSize=10&title=markt&category=culture&startDate=2026-05-01&endDate=2026-05-31&sortBy=title&ordering=desc&distance=5",
      headers: {
        "accept-language": "en-GB,en;q=0.8",
      },
    });
    const detailResponse = await app.inject({
      method: "GET",
      url: "/api/content/events/smart-village-id?lang=pl",
    });

    expect(listResponse.statusCode).toBe(200);
    expect(detailResponse.statusCode).toBe(200);
    expect(repository.getEvents).toHaveBeenCalledWith("en", {
      lang: undefined,
      pageNumber: 2,
      pageSize: 10,
      title: "markt",
      category: "culture",
      startDate: "2026-05-01",
      endDate: "2026-05-31",
      sortBy: "title",
      ordering: "desc",
      distance: 5,
    });
    expect(repository.getEventById).toHaveBeenCalledWith("pl", "smart-village-id");
  });

  it("exposes separate liveness and readiness endpoints", async () => {
    const app = createApp({
      config: baseConfig,
      repository,
      readinessProbe: async () => ({
        ready: false,
        checks: {
          postgrest: {
            ready: false,
          },
        },
      }),
    });
    apps.push(app);

    const liveResponse = await app.inject({
      method: "GET",
      url: "/health/live",
    });
    expect(liveResponse.statusCode).toBe(200);
    expect(liveResponse.json()).toEqual({ status: "ok" });

    const readyResponse = await app.inject({
      method: "GET",
      url: "/health/ready",
    });
    expect(readyResponse.statusCode).toBe(503);
    expect(readyResponse.json()).toEqual({
      status: "not_ready",
      contentSourceMode: "mock",
      ready: false,
      checks: {
        postgrest: {
          ready: false,
        },
      },
    });
  });

  it("maps upstream failures to the standardized outage contract", async () => {
    const failingRepository: PublicContentRepository = {
      ...repository,
      getProjects: vi.fn(async () => {
        throw new GatewayError({
          code: "UPSTREAM_TIMEOUT",
          message: "postgrest request timed out",
          statusCode: 503,
          upstream: "postgrest",
          retryable: true,
        });
      }),
    };

    const app = createApp({ config: baseConfig, repository: failingRepository });
    apps.push(app);
    const response = await app.inject({
      method: "GET",
      url: "/api/content/projects",
    });

    expect(response.statusCode).toBe(503);
    expect(response.json()).toEqual({
      error: expect.objectContaining({
        code: "UPSTREAM_TIMEOUT",
        upstream: "postgrest",
        retryable: true,
      }),
    });
  });

  it("maps bundled public content failures to the standardized outage contract", async () => {
    const failingRepository: PublicContentRepository = {
      ...repository,
      getPublicContent: vi.fn(async () => {
        throw new GatewayError({
          code: "UPSTREAM_TIMEOUT",
          message: "postgrest request timed out",
          statusCode: 503,
          upstream: "postgrest",
          retryable: true,
        });
      }),
    };

    const app = createApp({ config: baseConfig, repository: failingRepository });
    apps.push(app);
    const response = await app.inject({
      method: "GET",
      url: "/api/content/public",
    });

    expect(response.statusCode).toBe(503);
    expect(response.json()).toEqual({
      error: expect.objectContaining({
        code: "UPSTREAM_TIMEOUT",
        upstream: "postgrest",
        retryable: true,
      }),
    });
  });

  it("maps invalid upstream payloads deterministically", async () => {
    const failingRepository: PublicContentRepository = {
      ...repository,
      getEvents: vi.fn(async () => {
        throw new GatewayError({
          code: "INVALID_UPSTREAM_PAYLOAD",
          message: "Missing required field: event.title",
          statusCode: 502,
          upstream: "postgrest",
          retryable: false,
        });
      }),
    };

    const app = createApp({ config: baseConfig, repository: failingRepository });
    apps.push(app);
    const response = await app.inject({
      method: "GET",
      url: "/api/content/events",
    });

    expect(response.statusCode).toBe(502);
    expect(response.json()).toEqual({
      error: expect.objectContaining({
        code: "INVALID_UPSTREAM_PAYLOAD",
        upstream: "postgrest",
        retryable: false,
      }),
    });
  });

  it("maps unexpected errors to a gateway internal error", async () => {
    const failingRepository: PublicContentRepository = {
      ...repository,
      getHome: vi.fn(async () => {
        throw new Error("unexpected failure");
      }),
    };

    const app = createApp({ config: baseConfig, repository: failingRepository });
    apps.push(app);
    const response = await app.inject({
      method: "GET",
      url: "/api/content/home",
    });

    expect(response.statusCode).toBe(500);
    expect(response.json()).toEqual({
      error: expect.objectContaining({
        code: "INTERNAL_ERROR",
        upstream: "gateway",
        retryable: false,
      }),
    });
  });
});
