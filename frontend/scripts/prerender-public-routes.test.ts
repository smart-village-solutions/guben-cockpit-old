import { describe, expect, it, vi } from "vitest";

describe("prerender public routes", () => {
  it("skips event detail pages that return 404 during prerendering", async () => {
    const responses = new Map<string, Response>([
      [
        "http://localhost:5100/api/content/events/missing",
        new Response(JSON.stringify({ error: { code: "NOT_FOUND" } }), {
          status: 404,
          headers: { "content-type": "application/json" },
        }),
      ],
    ]);
    const fetchMock = vi.fn(async (input: string | URL | Request) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
      const response = responses.get(url);
      if (!response) {
        throw new Error(`Unexpected fetch for ${url}`);
      }
      return response;
    });
    const warn = vi.fn();

    vi.stubGlobal("fetch", fetchMock);

    const { renderEventDetail } = await import("./prerender-public-routes");

    await expect(renderEventDetail("<html><head></head><body><div id=\"root\"></div></body></html>", "missing", warn))
      .resolves.toBeNull();

    expect(warn).toHaveBeenCalledWith(
      "Skipping prerender for missing event detail",
      expect.objectContaining({
        eventId: "missing",
        statusCode: 404,
      }),
    );
  });
});
