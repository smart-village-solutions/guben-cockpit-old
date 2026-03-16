import { describe, expect, it } from "vitest";

import { loadConfig } from "../src/config.js";

describe("loadConfig", () => {
  it("allows mock mode without postgrest or cms configuration", () => {
    const config = loadConfig({
      CONTENT_SOURCE_MODE: "mock",
      PUBLIC_BASE_URL: "http://localhost:3000",
      MASTERPORTAL_URL: "http://masterportal",
    });

    expect(config.CONTENT_SOURCE_MODE).toBe("mock");
  });

  it("requires postgrest configuration in postgrest mode", () => {
    expect(() =>
      loadConfig({
        CONTENT_SOURCE_MODE: "postgrest",
        PUBLIC_BASE_URL: "http://localhost:3000",
        MASTERPORTAL_URL: "http://masterportal",
      }),
    ).toThrow();
  });

  it("accepts postgrest mode when required values are present", () => {
    const config = loadConfig({
      CONTENT_SOURCE_MODE: "postgrest",
      PUBLIC_BASE_URL: "http://localhost:3000",
      MASTERPORTAL_URL: "http://masterportal",
      POSTGREST_URL: "http://localhost:3001",
      POSTGREST_TIMEOUT_MS: "100",
      POSTGREST_SCHEMA: "public_content",
    });

    expect(config.CONTENT_SOURCE_MODE).toBe("postgrest");
    if (config.CONTENT_SOURCE_MODE !== "postgrest") {
      throw new Error("expected postgrest config");
    }
    expect(config.POSTGREST_URL).toBe("http://localhost:3001");
  });
});
