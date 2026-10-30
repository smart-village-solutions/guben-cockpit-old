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

it("splits large booking text collections into bounded requests and retains order", async () => {
  const fetcher = vi.fn().mockImplementation(async (_url, init) => ({ ok: true, json: async () => ({ translatedText: JSON.parse(init.body).q.map((text: string) => `EN ${text}`) }) }));
  vi.stubGlobal("fetch", fetcher);
  const { translateBatchedMultiple, translateHtmlBatchedMultiple } = await import("./translateUtils");
  const texts = Array.from({ length: 121 }, (_, index) => `Text ${index}`);
  expect(await translateBatchedMultiple(texts, "en")).toEqual(texts.map((text) => `EN ${text}`));
  const html = texts.map((text) => `<p>${text}</p>`).join("");
  expect(await translateHtmlBatchedMultiple([html], "en")).toEqual([texts.map((text) => `<p>EN ${text}</p>`).join("")]);
  expect(fetcher).toHaveBeenCalledTimes(14);
  expect(fetcher.mock.calls.every((call) => JSON.parse(call[1].body).q.length <= 20)).toBe(true);
});

it("retries HTML with partially untranslated segments instead of caching the fallback", async () => {
  const fetcher = vi.fn().mockResolvedValueOnce({ ok: true, json: async () => ({ translatedText: ["Hello", "Welt"] }) })
    .mockResolvedValueOnce({ ok: true, json: async () => ({ translatedText: ["Hello", "World"] }) });
  vi.stubGlobal("fetch", fetcher);
  const { translateHtmlBatchedMultiple, TranslatedHtml } = await import("./translateUtils");
  const html = "<p>Hallo</p><p>Welt</p>";
  expect(await translateHtmlBatchedMultiple([html], "en")).toEqual(["<p>Hello</p><p>Welt</p>"]);
  expect(renderToStaticMarkup(<TranslatedHtml text={html} />)).toBe("<div><p>Hello</p><p>Welt</p></div>");
  expect(await translateHtmlBatchedMultiple([html], "en")).toEqual(["<p>Hello</p><p>World</p>"]);
  expect(fetcher).toHaveBeenCalledTimes(2);
});

it("displays translated prose even when names and numbers stay unchanged, preserving inline spacing", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ translatedText: ["Welcome", "Guben", "8", "."] }) }));
  const { translateHtmlBatchedMultiple, TranslatedHtml } = await import("./translateUtils");
  const html = "<p>Willkommen <strong>Guben</strong> <span>8</span>.</p>";
  await translateHtmlBatchedMultiple([html], "en");
  expect(renderToStaticMarkup(<TranslatedHtml text={html} />)).toBe("<div><p>Welcome <strong>Guben</strong> <span>8</span>.</p></div>");
});
