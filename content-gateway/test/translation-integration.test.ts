import { describe, expect, it, vi } from "vitest";
import { AutomaticTranslator } from "../src/translation/automatic-translator.js";
import { SmartVillagePostgrestContentRepository } from "../src/content/smart-village-postgrest-content-repository.js";
import { createApp } from "../src/app.js";
import { loadConfig } from "../src/config.js";
import { MockContentRepository } from "../src/content/content-repository.js";
import { mockEventsContent } from "../src/content/mock-data.js";

const translator = () => new AutomaticTranslator({
  url: "https://translate.invalid/translate",
  fetch: vi.fn<typeof fetch>().mockImplementation(async (_url, init) => {
    const body = JSON.parse(String(init?.body)) as { q: string[] };
    return new Response(JSON.stringify({ translatedText: body.q.map((text) => `EN ${text}`) }));
  }),
});

describe("gateway translation integration", () => {
  it("preserves existing FAQ translations, fills absent collections and translates mainserver events only", async () => {
    const german = { id: "de-faq", question: "Frage", answer: "Antwort", languageCode: "de", sortWeight: 1 };
    const polish = { ...german, id: "pl-faq", question: "Pytanie", languageCode: "pl" };
    const repository = new SmartVillagePostgrestContentRepository({
      translator: translator(),
      smartVillageBookingFaqRepository: { getBookingFaqs: async (language: string) => ({ items: language === "de" ? [german] : language === "pl" ? [polish] : [] }) } as never,
      smartVillageEventRepository: { getEvents: async () => mockEventsContent } as never,
      postgrestRepository: {} as never,
      smartVillageCockpitCardRepository: {} as never,
      smartVillagePoiRepository: {} as never,
      smartVillageFeaturedProjectRepository: {} as never,
    });
    expect((await repository.getBookingFaqs("pl")).items).toEqual([polish]);
    expect((await repository.getBookingFaqs("en")).items[0]).toMatchObject({ question: "EN Frage", answer: "EN Antwort", languageCode: "en" });
    const events = await repository.getEvents("en", { pageNumber: 1, pageSize: 25 });
    expect(events.page).toEqual(mockEventsContent.page);
    expect(events.events.results[0].title).toBe(`EN ${mockEventsContent.events.results[0].title}`);
    expect(events.events.results[0].id).toBe(mockEventsContent.events.results[0].id);
  });

  it("provides bounded translation requests for browser-only booking content", async () => {
    const app = createApp({ config: loadConfig({ LOG_LEVEL: "silent" }), repository: new MockContentRepository(), translator: translator() });
    try {
      const response = await app.inject({ method: "POST", url: "/api/content/translate", payload: { q: ["Hallo"], target: "en" } });
      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual({ translatedText: ["EN Hallo"] });
      for (const payload of [{ q: ["Hallo"], target: "fr" }, { q: Array(101).fill("Hallo"), target: "en" }]) {
        expect((await app.inject({ method: "POST", url: "/api/content/translate", payload })).statusCode).toBe(400);
      }
    } finally { await app.close(); }
  });
});

it("fills local PostgREST gaps before mapping and localizes footer content", async () => {
  const { PostgrestContentRepository } = await import("../src/content/postgrest-content-repository.js");
  const repository = new PostgrestContentRepository(loadConfig({}), {
    select: async (table: string) => table === "pages" ? [{ id: "Projects", translations: { de: { Title: "Projekte", Description: "Beschreibung" }, en: { Title: "Existing title", Description: "" } } }] : [{ id: "footer", name: "Kontakt", content: "Inhalt" }],
  } as never, translator());
  const metadata = await repository.getFeaturedProjectsMetadata("en");
  expect(metadata.page.title).toBe("Existing title");
  expect(metadata.page.description).toBe("EN Beschreibung");
  expect((await repository.getFooter("en")).items[0]).toEqual({ id: "footer", name: "EN Kontakt", content: "EN Inhalt" });
});
