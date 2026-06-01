import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createApp } from "../src/app.js";
import { GatewayError } from "../src/errors.js";
import type { PublicContentRepository } from "../src/content/content-repository.js";
import { loadConfig } from "../src/config.js";
import { mockDashboardContent, mockEventDetail, mockEventsContent, mockFooterContent, mockHomeContent, mockMapContent, mockProjectsContent, mockPublicContentBundle } from "../src/content/mock-data.js";

const baseConfig = loadConfig({
  PORT: "5100",
  LOG_LEVEL: "silent",
  PUBLIC_BASE_URL: "http://localhost:3000",
  MASTERPORTAL_URL: "http://masterportal",
  CONTENT_SOURCE_MODE: "mock",
  DEFAULT_LANGUAGE: "de",
  FALLBACK_LANGUAGE: "de",
});

const repositoryStub = (): PublicContentRepository => ({
  getHome: vi.fn(async () => mockHomeContent),
  getProjects: vi.fn(async () => mockProjectsContent),
  getPublicContent: vi.fn(async () => mockPublicContentBundle),
  getEvents: vi.fn(async () => mockEventsContent),
  getEventById: vi.fn(async () => mockEventDetail),
  getBookingTenants: vi.fn(async () => ({
    tenants: mockEventsContent.events.bookingTenants,
  })),
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
    expect(mapResponse.json().map.embedUrl).toBe("https://masterportal.example.com");

    const footerResponse = await app.inject({
      method: "GET",
      url: "/api/content/footer",
    });
    expect(footerResponse.statusCode).toBe(200);
    expect(footerResponse.json().items).toHaveLength(3);
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
