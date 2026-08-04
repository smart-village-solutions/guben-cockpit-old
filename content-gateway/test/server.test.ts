import { afterEach, describe, expect, it, vi } from "vitest";

import type { Config } from "../src/config.js";

const mockConfig: Config = {
  PORT: 5100,
  LOG_LEVEL: "silent",
  PUBLIC_BASE_URL: "http://localhost:3000",
  CONTENT_SOURCE_MODE: "mock",
  DEFAULT_LANGUAGE: "de",
  FALLBACK_LANGUAGE: "de",
};

describe("server bootstrap", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.resetModules();
  });

  it("starts the app with the configured host and port", async () => {
    const listen = vi.fn(async () => undefined);
    const error = vi.fn();

    vi.doMock("../src/config.js", () => ({
      loadConfig: () => mockConfig,
    }));
    vi.doMock("../src/content/content-repository.js", () => ({
      MockContentRepository: class MockContentRepository {},
      PostgrestContentRepository: class PostgrestContentRepository {},
    }));
    vi.doMock("../src/upstream/postgrest-client.js", () => ({
      PostgrestClient: class PostgrestClient {},
    }));
    vi.doMock("../src/app.js", () => ({
      createApp: () => ({
        listen,
        log: {
          error,
        },
      }),
    }));

    await import("../src/server.js");

    expect(listen).toHaveBeenCalledWith({
      host: "0.0.0.0",
      port: 5100,
    });
    expect(error).not.toHaveBeenCalled();
  });

  it("records startup failures without crashing the import", async () => {
    const listen = vi.fn(async () => {
      throw new Error("listen failed");
    });
    const error = vi.fn();

    vi.doMock("../src/config.js", () => ({
      loadConfig: () => mockConfig,
    }));
    vi.doMock("../src/content/content-repository.js", () => ({
      MockContentRepository: class MockContentRepository {},
      PostgrestContentRepository: class PostgrestContentRepository {},
    }));
    vi.doMock("../src/upstream/postgrest-client.js", () => ({
      PostgrestClient: class PostgrestClient {},
    }));
    vi.doMock("../src/app.js", () => ({
      createApp: () => ({
        listen,
        log: {
          error,
        },
      }),
    }));

    const originalExitCode = process.exitCode;

    await import("../src/server.js");

    expect(error).toHaveBeenCalledWith(expect.any(Error), "Failed to start content gateway");
    expect(process.exitCode).toBe(1);
    process.exitCode = originalExitCode;
  });

  it("wires the postgrest readiness probe through the server bootstrap", async () => {
    const listen = vi.fn(async () => undefined);
    const checkReadiness = vi.fn(async () => true);
    const checkGraphqlReadiness = vi.fn(async () => ({ eventRecords: [{ id: "sv-1" }] }));
    const smartVillageEventRepositoryOptions: Array<Record<string, unknown>> = [];
    const smartVillageCockpitCardRepositoryOptions: Array<Record<string, unknown>> = [];
    const createApp = vi.fn(() => ({
      listen,
      log: {
        error: vi.fn(),
        warn: vi.fn(),
      },
    }));
    const wrapperRepositoryInstances: unknown[] = [];
    const wrapperRepositoryOptions: Array<Record<string, unknown>> = [];

    vi.doMock("../src/config.js", () => ({
      loadConfig: () => ({
        ...mockConfig,
        CONTENT_SOURCE_MODE: "postgrest",
        POSTGREST_URL: "http://postgrest",
        POSTGREST_TIMEOUT_MS: 1000,
        POSTGREST_SCHEMA: "public_content",
        SV_GRAPHQL_URL: "https://smart-village.example/graphql",
        SV_OAUTH_TOKEN_URL: "https://smart-village.example/oauth/token",
        SV_CLIENT_ID: "client-id",
        SV_CLIENT_SECRET: "client-secret",
      }),
    }));
    vi.doMock("../src/content/content-repository.js", () => ({
      MockContentRepository: class MockContentRepository {},
      PostgrestContentRepository: class PostgrestContentRepository {
        public constructor() {}
      },
    }));
    vi.doMock("../src/content/smart-village-postgrest-content-repository.js", () => ({
      SmartVillagePostgrestContentRepository: class SmartVillagePostgrestContentRepository {
        public constructor(options: Record<string, unknown>) {
          wrapperRepositoryInstances.push(this);
          wrapperRepositoryOptions.push(options);
        }
      },
    }));
    vi.doMock("../src/content/smart-village-event-repository.js", () => ({
      SmartVillageEventRepository: class SmartVillageEventRepository {
        public constructor(options: Record<string, unknown>) {
          smartVillageEventRepositoryOptions.push(options);
        }
      },
    }));
    vi.doMock("../src/content/smart-village-cockpit-card-repository.js", () => ({
      SmartVillageCockpitCardRepository: class SmartVillageCockpitCardRepository {
        public constructor(options: Record<string, unknown>) {
          smartVillageCockpitCardRepositoryOptions.push(options);
        }
      },
    }));
    vi.doMock("../src/upstream/postgrest-client.js", () => ({
      PostgrestClient: class PostgrestClient {
        public checkReadiness = checkReadiness;
      },
    }));
    vi.doMock("../src/upstream/smart-village-oauth-client.js", () => ({
      SmartVillageOAuthClient: class SmartVillageOAuthClient {},
    }));
    vi.doMock("../src/upstream/smart-village-graphql-client.js", () => ({
      SmartVillageGraphQLClient: class SmartVillageGraphQLClient {
        public request = checkGraphqlReadiness;
      },
    }));
    vi.doMock("../src/app.js", () => ({
      createApp,
    }));

    await import("../src/server.js");

    const [options] = (createApp.mock.calls as unknown as Array<[{
      repository: unknown;
      readinessProbe: () => Promise<{
        ready: boolean;
        checks: Record<string, { ready: boolean }>;
      }>;
    }]>)[0] ?? [];
    expect(options).toBeDefined();
    if (!options) {
      throw new Error("createApp was not called");
    }
    await expect(options.readinessProbe()).resolves.toEqual({
      ready: true,
      checks: {
        postgrest: {
          ready: true,
        },
        smartvillage: {
          ready: true,
        },
      },
    });
    expect(checkReadiness).toHaveBeenCalled();
    expect(checkGraphqlReadiness).toHaveBeenCalledWith(expect.stringContaining("eventRecords"));
    expect(options.repository).toBe(wrapperRepositoryInstances[0]);
    expect(smartVillageEventRepositoryOptions[0]?.warn).toEqual(expect.any(Function));
    expect(smartVillageCockpitCardRepositoryOptions[0]).toMatchObject({
      client: expect.any(Object),
      warn: expect.any(Function),
    });
    expect(wrapperRepositoryOptions[0]).toMatchObject({
      smartVillageCockpitCardRepository: expect.any(Object),
      smartVillagePoiRepository: expect.any(Object),
      warn: expect.any(Function),
    });
  });

  it("reports Smart Village readiness separately without failing the overall readiness payload construction", async () => {
    const listen = vi.fn(async () => undefined);
    const checkReadiness = vi.fn(async () => true);
    const checkGraphqlReadiness = vi.fn(async () => {
      throw new Error("smart village unavailable");
    });
    const smartVillageEventRepositoryOptions: Array<Record<string, unknown>> = [];
    const createApp = vi.fn(() => ({
      listen,
      log: {
        error: vi.fn(),
        warn: vi.fn(),
      },
    }));

    vi.doMock("../src/config.js", () => ({
      loadConfig: () => ({
        ...mockConfig,
        CONTENT_SOURCE_MODE: "postgrest",
        POSTGREST_URL: "http://postgrest",
        POSTGREST_TIMEOUT_MS: 1000,
        POSTGREST_SCHEMA: "public_content",
        SV_GRAPHQL_URL: "https://smart-village.example/graphql",
        SV_OAUTH_TOKEN_URL: "https://smart-village.example/oauth/token",
        SV_CLIENT_ID: "client-id",
        SV_CLIENT_SECRET: "client-secret",
      }),
    }));
    vi.doMock("../src/content/content-repository.js", () => ({
      MockContentRepository: class MockContentRepository {},
      PostgrestContentRepository: class PostgrestContentRepository {
        public constructor() {}
      },
    }));
    vi.doMock("../src/content/smart-village-postgrest-content-repository.js", () => ({
      SmartVillagePostgrestContentRepository: class SmartVillagePostgrestContentRepository {
        public constructor() {}
      },
    }));
    vi.doMock("../src/content/smart-village-event-repository.js", () => ({
      SmartVillageEventRepository: class SmartVillageEventRepository {
        public constructor(options: Record<string, unknown>) {
          smartVillageEventRepositoryOptions.push(options);
        }
      },
    }));
    vi.doMock("../src/content/smart-village-cockpit-card-repository.js", () => ({
      SmartVillageCockpitCardRepository: class SmartVillageCockpitCardRepository {},
    }));
    vi.doMock("../src/upstream/postgrest-client.js", () => ({
      PostgrestClient: class PostgrestClient {
        public checkReadiness = checkReadiness;
      },
    }));
    vi.doMock("../src/upstream/smart-village-oauth-client.js", () => ({
      SmartVillageOAuthClient: class SmartVillageOAuthClient {},
    }));
    vi.doMock("../src/upstream/smart-village-graphql-client.js", () => ({
      SmartVillageGraphQLClient: class SmartVillageGraphQLClient {
        public request = checkGraphqlReadiness;
      },
    }));
    vi.doMock("../src/app.js", () => ({
      createApp,
    }));

    await import("../src/server.js");

    const [options] = (createApp.mock.calls as unknown as Array<[{
      readinessProbe: () => Promise<{
        ready: boolean;
        checks: Record<string, { ready: boolean }>;
      }>;
    }]>)[0] ?? [];
    expect(options).toBeDefined();
    if (!options) {
      throw new Error("createApp was not called");
    }
    await expect(options.readinessProbe()).resolves.toEqual({
      ready: false,
      checks: {
        postgrest: {
          ready: true,
        },
        smartvillage: {
          ready: false,
        },
      },
    });
    expect(checkReadiness).toHaveBeenCalled();
    expect(checkGraphqlReadiness).toHaveBeenCalledWith(expect.stringContaining("eventRecords"));
    expect(smartVillageEventRepositoryOptions[0]?.warn).toEqual(expect.any(Function));
  });
});
