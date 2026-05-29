import { describe, expect, it } from "vitest";

import {
  MockContentRepository,
  PostgrestContentRepository,
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

  it("keeps the exported PostgrestContentRepository alias wired to the main implementation", () => {
    const repository = new PostgrestContentRepository(config, {
      select: async () => [],
    } as never);

    expect(repository).toBeInstanceOf(PostgrestContentRepository);
    expect(typeof repository.getHome).toBe("function");
    expect(typeof repository.getEvents).toBe("function");
  });
});
