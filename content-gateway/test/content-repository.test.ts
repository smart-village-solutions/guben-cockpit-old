import { describe, expect, it, vi } from "vitest";

import {
  eventDetailContentSchema,
  eventsContentSchema,
} from "../../shared/public-content/contracts.js";

import {
  MockContentRepository,
  PostgrestContentRepository,
  SmartVillagePostgrestContentRepository,
} from "../src/content/content-repository.js";
import {
  mockDashboardContent,
  mockEventDetail,
  mockEventsContent,
  mockFooterContent,
  mockHomeContent,
  mockMapContent,
  mockProjectsContent,
} from "../src/content/mock-data.js";
import type { PostgrestConfig } from "../src/config.js";

const config: PostgrestConfig = {
  PORT: 5100,
  LOG_LEVEL: "silent",
  PUBLIC_BASE_URL: "http://localhost:3000",
  MASTERPORTAL_URL: "http://masterportal",
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
  it("parses the mock repository payloads against the shared schemas", async () => {
    const repository = new MockContentRepository();

    await expect(repository.getHome()).resolves.toEqual(mockHomeContent);
    await expect(repository.getProjects()).resolves.toEqual(mockProjectsContent);
    await expect(repository.getEvents()).resolves.toEqual(mockEventsContent);
    await expect(repository.getDashboard()).resolves.toEqual(mockDashboardContent);
    await expect(repository.getMap()).resolves.toEqual(mockMapContent);
    await expect(repository.getFooter()).resolves.toEqual(mockFooterContent);
    await expect(repository.getBookingTenants()).resolves.toEqual({
      tenants: mockEventsContent.events.bookingTenants,
    });
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
    const repository = new SmartVillagePostgrestContentRepository({
      postgrestRepository: postgrestRepository as never,
      smartVillageEventRepository: smartVillageEventRepository as never,
    });
    const home = await repository.getHome("de");
    const events = await repository.getEvents("de", filters);
    const eventDetail = await repository.getEventById("de", mockEventDetail.event.id);

    expect(home).toEqual(mockHomeContent);
    expect(events).toEqual(eventsContentSchema.parse(mockEventsContent));
    expect(eventDetail).toEqual(eventDetailContentSchema.parse(mockEventDetail));

    expect(postgrestRepository.getHome).toHaveBeenCalledWith("de");
    expect(smartVillageEventRepository.getEvents).toHaveBeenCalledWith("de", filters);
    expect(smartVillageEventRepository.getEventById).toHaveBeenCalledWith("de", mockEventDetail.event.id);
    expect(postgrestRepository.getProjects).not.toHaveBeenCalled();
    expect(postgrestRepository.getBookingTenants).not.toHaveBeenCalled();
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
});
