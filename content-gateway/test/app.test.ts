import { beforeEach, describe, expect, it, vi } from "vitest";

import { createApp } from "../src/app.js";
import { GatewayError } from "../src/errors.js";
import type { PublicContentRepository } from "../src/content/content-repository.js";
import { loadConfig } from "../src/config.js";
import { mockDashboardContent, mockEventDetail, mockEventsContent, mockFooterContent, mockHomeContent, mockMapContent, mockProjectsContent } from "../src/content/mock-data.js";
import { CmsClient } from "../src/upstream/cms-client.js";

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

  beforeEach(() => {
    repository = repositoryStub();
  });

  it("serves health and content endpoints", async () => {
    const app = createApp({ config: baseConfig, repository });

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

  it("maps cms failures to the same outage contract", async () => {
    const failingRepository: PublicContentRepository = {
      ...repository,
      getHome: vi.fn(async () => {
        throw new GatewayError({
          code: "UPSTREAM_UNAVAILABLE",
          message: "cms request failed",
          statusCode: 503,
          upstream: "cms",
          retryable: true,
        });
      }),
    };

    const app = createApp({ config: baseConfig, repository: failingRepository });
    const response = await app.inject({
      method: "GET",
      url: "/api/content/home",
    });

    expect(response.statusCode).toBe(503);
    expect(response.json()).toEqual({
      error: expect.objectContaining({
        code: "UPSTREAM_UNAVAILABLE",
        upstream: "cms",
        retryable: true,
      }),
    });
  });

  it("never leaks cms credentials in thrown errors", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ errors: [{ message: "invalid" }] }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const client = new CmsClient({
      CMS_GRAPHQL_URL: "https://cms.example.com/graphql",
      CMS_API_KEY: "super-secret-key",
      CMS_API_KEY_HEADER: "x-api-key",
      CMS_TIMEOUT_MS: 100,
      CMS_RETRY_ATTEMPTS: 0,
      CMS_RETRY_BACKOFF_MS: 0,
    });
    await expect(client.execute("query { ping }")).rejects.toThrow(
      "cms returned an invalid GraphQL payload",
    );

    const [url, init] = fetchMock.mock.calls[0] as [string, { headers: Record<string, string> }];
    expect(url).toBe("https://cms.example.com/graphql");
    expect(init.headers["x-api-key"]).toBe("super-secret-key");

    try {
      await client.execute("query { ping }");
    } catch (error) {
      expect(String(error)).not.toContain("super-secret-key");
    }
  });
});
