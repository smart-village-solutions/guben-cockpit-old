import { afterEach, describe, expect, it, vi } from "vitest";

import type { Config } from "../src/config.js";

const mockConfig: Config = {
  PORT: 5100,
  LOG_LEVEL: "silent",
  PUBLIC_BASE_URL: "http://localhost:3000",
  MASTERPORTAL_URL: "http://masterportal",
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
    const createApp = vi.fn(() => ({
      listen,
      log: {
        error: vi.fn(),
      },
    }));

    vi.doMock("../src/config.js", () => ({
      loadConfig: () => ({
        ...mockConfig,
        CONTENT_SOURCE_MODE: "postgrest",
        POSTGREST_URL: "http://postgrest",
        POSTGREST_TIMEOUT_MS: 1000,
        POSTGREST_SCHEMA: "public_content",
      }),
    }));
    vi.doMock("../src/content/content-repository.js", () => ({
      MockContentRepository: class MockContentRepository {},
      PostgrestContentRepository: class PostgrestContentRepository {
        public constructor() {}
      },
    }));
    vi.doMock("../src/upstream/postgrest-client.js", () => ({
      PostgrestClient: class PostgrestClient {
        public checkReadiness = checkReadiness;
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
      ready: true,
      checks: {
        postgrest: {
          ready: true,
        },
      },
    });
    expect(checkReadiness).toHaveBeenCalled();
  });
});
