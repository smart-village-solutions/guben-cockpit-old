import { describe, expect, it, vi } from "vitest";
import { AutomaticTranslator } from "../src/translation/automatic-translator.js";
import { mergeLanguageRecords } from "../src/translation/merge-language-records.js";

describe("partial language collections", () => {
  it("fills missing fields and missing records by explicit key, retaining existing translations and IDs", async () => {
    const translator = new AutomaticTranslator({ url: "https://translate.invalid/translate", fetch: vi.fn<typeof fetch>().mockImplementation(async (_url, init) => new Response(JSON.stringify({ translatedText: JSON.parse(String(init?.body)).q.map((text: string) => `EN ${text}`) }))) });
    const result = await mergeLanguageRecords({
      source: [{ id: "de-1", translationKey: "one", question: "Frage", answer: "Antwort" }, { id: "de-2", translationKey: "two", question: "Zweite Frage", answer: "Zweite Antwort" }],
      target: [{ id: "en-1", translationKey: "one", question: "Existing question", answer: "" }],
      key: (entry) => entry.translationKey,
      translate: (entry) => translator.content(entry, "en"),
      fill: (source, target) => translator.fillMissing(source, target, "en"),
    });
    expect(result).toEqual([{ id: "en-1", translationKey: "one", question: "Existing question", answer: "EN Antwort" }, { id: "de-2", translationKey: "two", question: "EN Zweite Frage", answer: "EN Zweite Antwort" }]);
  });

  it("does not infer missing translations from ordering or duplicate keys", async () => {
    const translate = vi.fn(async (item: { key?: string }) => item);
    const target = [{ key: "duplicate" }, { key: "duplicate" }];
    const result = await mergeLanguageRecords({ source: [{}, { key: "duplicate" }], target, key: (entry) => entry.key, translate, fill: async (_source, entry) => entry });
    expect(result).toEqual(target);
    expect(translate).not.toHaveBeenCalled();
  });
});
