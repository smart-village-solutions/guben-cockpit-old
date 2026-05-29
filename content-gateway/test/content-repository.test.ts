import { describe, expect, it } from "vitest";

import {
  MockContentRepository,
  PostgrestContentRepository,
  SmartVillagePostgrestContentRepository,
} from "../src/content/content-repository.js";
import {
  mockDashboardContent,
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

  it("routes runtime event reads through Smart Village while keeping other content on PostgREST", async () => {
    const postgrestRepository = {
      getHome: async () => ({ source: "postgrest", scope: "home" }),
      getProjects: async () => ({ source: "postgrest", scope: "projects" }),
      getDashboard: async () => ({ source: "postgrest", scope: "dashboard" }),
      getMap: async () => ({ source: "postgrest", scope: "map" }),
      getFooter: async () => ({ source: "postgrest", scope: "footer" }),
      getBookingTenants: async () => ({ source: "postgrest", scope: "booking-tenants" }),
    };
    const smartVillageEventRepository = {
      getEvents: async () => ({ source: "smartvillage", scope: "events" }),
      getEventById: async () => ({ source: "smartvillage", scope: "event-detail" }),
    };
    const repository = new SmartVillagePostgrestContentRepository({
      postgrestRepository: postgrestRepository as never,
      smartVillageEventRepository: smartVillageEventRepository as never,
    });

    await expect(repository.getHome("de")).resolves.toEqual({ source: "postgrest", scope: "home" });
    await expect(repository.getProjects("de", 1, 10)).resolves.toEqual({
      source: "postgrest",
      scope: "projects",
    });
    await expect(repository.getEvents("de", {} as never)).resolves.toEqual({
      source: "smartvillage",
      scope: "events",
    });
    await expect(repository.getEventById("de", "event-id")).resolves.toEqual({
      source: "smartvillage",
      scope: "event-detail",
    });
    await expect(repository.getDashboard("de")).resolves.toEqual({
      source: "postgrest",
      scope: "dashboard",
    });
    await expect(repository.getMap("de")).resolves.toEqual({ source: "postgrest", scope: "map" });
    await expect(repository.getFooter()).resolves.toEqual({ source: "postgrest", scope: "footer" });
    await expect(repository.getBookingTenants()).resolves.toEqual({
      source: "postgrest",
      scope: "booking-tenants",
    });
  });
});
