import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { AutomaticTranslator } from "../src/translation/automatic-translator.js";

const response = (translatedText: unknown) => new Response(JSON.stringify({ translatedText }), { status: 200 });

describe("automatic content translation", () => {
  it("reuses successful translations across concurrent calls and service restarts, invalidating changed source text", async () => {
    const cacheDir = await mkdtemp(join(tmpdir(), "cockpit-translations-"));
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(response(["Hello"]));
    const options = { url: "https://translation.invalid/translate", cacheDir, fetch: fetcher };
    try {
      const translator = new AutomaticTranslator(options);
      expect(await Promise.all([translator.text("Hallo", "en"), translator.text("Hallo", "en")])).toEqual(["Hello", "Hello"]);
      expect(fetcher).toHaveBeenCalledTimes(1);
      expect(await new AutomaticTranslator(options).text("Hallo", "en")).toBe("Hello");
      expect(fetcher).toHaveBeenCalledTimes(1);
      fetcher.mockResolvedValueOnce(response(["Good day"]));
      expect(await translator.text("Guten Tag", "en")).toBe("Good day");
      expect(fetcher).toHaveBeenCalledTimes(2);
    } finally { await rm(cacheDir, { recursive: true, force: true }); }
  });

  it("keeps originals on outage or malformed responses and retries later", async () => {
    const fetcher = vi.fn<typeof fetch>()
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce(response([]))
      .mockResolvedValueOnce(response(["Hello"]));
    const translator = new AutomaticTranslator({ url: "https://translation.invalid/translate", fetch: fetcher });
    expect(await translator.text("Hallo", "en")).toBe("Hallo");
    expect(await translator.text("Hallo", "en")).toBe("Hallo");
    expect(await translator.text("Hallo", "en")).toBe("Hello");
  });

  it("preserves HTML attributes, entities, links and addresses, escaping translated markup", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(response(["Hello <script>", "World"]));
    const translator = new AutomaticTranslator({ url: "https://translation.invalid/translate", fetch: fetcher });
    const original = '<p class="intro">Hallo <a href="https://guben.de">Welt</a>&nbsp;https://guben.de kontakt@guben.de</p>';
    const translated = await translator.text(original, "pl");
    expect(translated).toBe('<p class="intro">Hello &lt;script&gt; <a href="https://guben.de">World</a>&nbsp;https://guben.de kontakt@guben.de</p>');
    const body = JSON.parse(String(fetcher.mock.calls[0][1]?.body));
    expect(body).toMatchObject({ q: ["Hallo", "Welt"], source: "auto", target: "pl", format: "text" });
  });

  it("translates only editorial fields and leaves German and unsupported languages untouched", async () => {
    const fetcher = vi.fn<typeof fetch>().mockImplementation(async () => response(["Translation"]));
    const translator = new AutomaticTranslator({ url: "https://translation.invalid/translate", fetch: fetcher });
    const original = { id: "id", title: "Museum Guben", description: "Beschreibung", location: { name: "Guben", street: "Berliner Straße" }, imageCredits: "Foto", url: "https://guben.de" };
    expect(await translator.content(original, "en", true)).toEqual({ ...original, description: "Translation" });
    expect(await translator.content(original, "de")).toEqual(original);
    expect(await translator.content(original, "fr")).toEqual(original);
    expect(original.description).toBe("Beschreibung");
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
});

describe("translation gaps", () => {
  it("fills individual language-dictionary fields without translating existing text or link targets", async () => {
    const fetcher = vi.fn<typeof fetch>().mockImplementation(async (_url, init) => {
      const { q } = JSON.parse(String(init?.body)) as { q: string[] };
      return response(q.map((text) => `EN ${text}`));
    });
    const translator = new AutomaticTranslator({ url: "https://translation.invalid/translate", fetch: fetcher });
    const original = {
      translations: { de: { Title: "Titel", Description: "Beschreibung", FullText: "Inhalt" }, en: { Title: "Existing title", Description: "" } },
      button_translations: { de: { Title: "Weiter", Url: "https://guben.de" }, en: { Title: "Continue" } },
    };
    const result = await translator.translations(original, "en");
    expect(result.translations.en).toEqual({ Title: "Existing title", Description: "EN Beschreibung", FullText: "EN Inhalt" });
    expect(result.button_translations.en).toEqual({ Title: "Continue", Url: "https://guben.de" });
    expect(original.translations.en.Description).toBe("");
    expect(fetcher.mock.calls.map((call) => JSON.parse(String(call[1]?.body)).q)).toEqual([["Beschreibung"], ["Inhalt"]]);
  });

  it("translates category and price labels but keeps location and organizer names", async () => {
    const fetcher = vi.fn<typeof fetch>().mockImplementation(async (_url, init) => response(JSON.parse(String(init?.body)).q.map((text: string) => `EN ${text}`)));
    const translator = new AutomaticTranslator({ url: "https://translation.invalid/translate", fetch: fetcher });
    const result = await translator.content({ categories: [{ id: "c", name: "Kultur" }], priceInformations: [{ name: "Erwachsene" }], location: { name: "Guben" }, organizerName: "Stadt Guben" }, "en");
    expect(result).toEqual({ categories: [{ id: "c", name: "EN Kultur" }], priceInformations: [{ name: "EN Erwachsene" }], location: { name: "Guben" }, organizerName: "Stadt Guben" });
  });
});
