import { describe, expect, it } from "vitest";

import { loadConfig } from "../src/config.js";

const expectString = (value: string) => value;

describe("loadConfig", () => {
  it("allows mock mode without postgrest or cms configuration", () => {
    const config = loadConfig({
      CONTENT_SOURCE_MODE: "mock",
      PUBLIC_BASE_URL: "http://localhost:3000",
      MASTERPORTAL_URL: "http://masterportal",
    });

    expect(config.CONTENT_SOURCE_MODE).toBe("mock");
  });

  it("ignores invalid Smart Village configuration in mock mode", () => {
    const config = loadConfig({
      CONTENT_SOURCE_MODE: "mock",
      PUBLIC_BASE_URL: "http://localhost:3000",
      MASTERPORTAL_URL: "http://masterportal",
      SV_GRAPHQL_URL: "not-a-url",
      SV_OAUTH_TOKEN_URL: "still-not-a-url",
      SV_CLIENT_ID: "",
      SV_CLIENT_SECRET: "",
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

  it("requires Smart Village event configuration in postgrest mode", () => {
    expect(() =>
      loadConfig({
        CONTENT_SOURCE_MODE: "postgrest",
        PUBLIC_BASE_URL: "http://localhost:3000",
        MASTERPORTAL_URL: "http://masterportal",
        POSTGREST_URL: "http://localhost:3001",
      }),
    ).toThrow(/SV_GRAPHQL_URL, SV_OAUTH_TOKEN_URL, SV_CLIENT_ID, SV_CLIENT_SECRET/);
  });

  it("accepts postgrest mode when all required values are present", () => {
    const config = loadConfig({
      CONTENT_SOURCE_MODE: "postgrest",
      PUBLIC_BASE_URL: "http://localhost:3000",
      MASTERPORTAL_URL: "http://masterportal",
      POSTGREST_URL: "http://localhost:3001",
      POSTGREST_TIMEOUT_MS: "100",
      POSTGREST_SCHEMA: "public_content",
      SV_GRAPHQL_URL: "https://bb-guben.server.smart-village.app/graphql",
      SV_OAUTH_TOKEN_URL: "https://bb-guben.server.smart-village.app/oauth/token",
      SV_CLIENT_ID: "application-id",
      SV_CLIENT_SECRET: "application-secret",
    });

    expect(config.CONTENT_SOURCE_MODE).toBe("postgrest");
    if (config.CONTENT_SOURCE_MODE !== "postgrest") {
      throw new Error("expected postgrest config");
    }
    expect(config.POSTGREST_URL).toBe("http://localhost:3001");
  });

  it("accepts complete Smart Village upstream oauth configuration", () => {
    const config = loadConfig({
      CONTENT_SOURCE_MODE: "postgrest",
      PUBLIC_BASE_URL: "http://localhost:3000",
      MASTERPORTAL_URL: "http://masterportal",
      POSTGREST_URL: "http://localhost:3001",
      SV_GRAPHQL_URL: "https://bb-guben.server.smart-village.app/graphql",
      SV_OAUTH_TOKEN_URL: "https://bb-guben.server.smart-village.app/oauth/token",
      SV_CLIENT_ID: "application-id",
      SV_CLIENT_SECRET: "application-secret",
    });

    if (config.CONTENT_SOURCE_MODE !== "postgrest") {
      throw new Error("expected postgrest config");
    }

    expectString(config.SV_GRAPHQL_URL);
    expectString(config.SV_OAUTH_TOKEN_URL);
    expectString(config.SV_CLIENT_ID);
    expectString(config.SV_CLIENT_SECRET);
    expect(config.SV_GRAPHQL_URL).toBe("https://bb-guben.server.smart-village.app/graphql");
    expect(config.SV_OAUTH_TOKEN_URL).toBe("https://bb-guben.server.smart-village.app/oauth/token");
    expect(config.SV_CLIENT_ID).toBe("application-id");
    expect(config.SV_CLIENT_SECRET).toBe("application-secret");
  });

  it("rejects partial Smart Village upstream oauth configuration", () => {
    expect(() =>
      loadConfig({
        CONTENT_SOURCE_MODE: "postgrest",
        PUBLIC_BASE_URL: "http://localhost:3000",
        MASTERPORTAL_URL: "http://masterportal",
        POSTGREST_URL: "http://localhost:3001",
        SV_GRAPHQL_URL: "https://bb-guben.server.smart-village.app/graphql",
      }),
    ).toThrow(/SV_GRAPHQL_URL, SV_OAUTH_TOKEN_URL, SV_CLIENT_ID, SV_CLIENT_SECRET/);
  });

  it("rejects non-local PUBLIC_BASE_URL over plain http", () => {
    expect(() =>
      loadConfig({
        CONTENT_SOURCE_MODE: "mock",
        PUBLIC_BASE_URL: "http://example.com",
        MASTERPORTAL_URL: "http://masterportal",
      }),
    ).toThrow(/PUBLIC_BASE_URL/);
  });

  it("rejects non-internal MASTERPORTAL_URL over plain http", () => {
    expect(() =>
      loadConfig({
        CONTENT_SOURCE_MODE: "mock",
        PUBLIC_BASE_URL: "http://localhost:3000",
        MASTERPORTAL_URL: "http://example.com",
      }),
    ).toThrow(/MASTERPORTAL_URL/);
  });

  it("rejects malformed PUBLIC_BASE_URL via validation instead of crashing URL parsing", () => {
    expect(() =>
      loadConfig({
        CONTENT_SOURCE_MODE: "mock",
        PUBLIC_BASE_URL: "not-a-url",
        MASTERPORTAL_URL: "http://masterportal",
      }),
    ).toThrow();
  });
});
