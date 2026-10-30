import { afterEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("@/public-content/source", () => ({ contentGatewayBaseUrl: "https://cockpit.example.com" }));
vi.mock("i18next", () => ({ default: { language: "en" } }));

afterEach(() => { vi.unstubAllGlobals(); vi.resetModules(); });

describe("gateway-backed browser translations", () => {
  it("keeps originals visible and retries fallback responses without exposing service credentials", async () => {
    const fetcher = vi.fn().mockResolvedValueOnce({ ok: true, json: async () => ({ translatedText: ["Hallo"] }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ translatedText: ["Hello"] }) });
    vi.stubGlobal("fetch", fetcher);
    const { TranslatedText, translateBatchedMultiple } = await import("./translateUtils");
    expect(renderToStaticMarkup(<TranslatedText text="Hallo" />)).toBe("Hallo");
    await translateBatchedMultiple(["Hallo"], "en");
    await translateBatchedMultiple(["Hallo"], "en");
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(String(fetcher.mock.calls[0][0])).toBe("https://cockpit.example.com/api/content/translate");
    expect(JSON.parse(fetcher.mock.calls[0][1].body)).toEqual({ q: ["Hallo"], target: "en" });
    expect(renderToStaticMarkup(<TranslatedText text="Hallo" />)).toBe("Hello");
  });

  it("shows original HTML while uncached and preserves its structure after translation", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ translatedText: ["Hello"] }) }));
    const { TranslatedHtml, translateHtmlBatchedMultiple } = await import("./translateUtils");
    expect(renderToStaticMarkup(<TranslatedHtml text="<p>Hallo</p>" />)).toBe("<div><p>Hallo</p></div>");
    await translateHtmlBatchedMultiple(["<p>Hallo</p>"], "en");
    expect(renderToStaticMarkup(<TranslatedHtml text="<p>Hallo</p>" />)).toBe("<div><p>Hello</p></div>");
  });
});
