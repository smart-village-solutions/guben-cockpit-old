import { describe, expect, it, vi } from "vitest";

import { SmartVillageBookingFaqRepository } from "../src/content/smart-village-booking-faq-repository.js";

const faq = (overrides: Record<string, unknown> = {}) => ({
  id: "faq-1",
  title: "1. Erste Frage",
  genericType: "FAQ",
  payload: { languageCode: "DE", sortWeight: 1 },
  contentBlocks: [{ body: "Antwort" }],
  ...overrides,
});

const createRepository = (genericItems: unknown, warn = vi.fn()) => {
  const request = vi.fn(async () => ({ genericItems }));
  return { repository: new SmartVillageBookingFaqRepository({ client: { request: request as never }, warn }), request, warn };
};

describe("SmartVillageBookingFaqRepository", () => {
  it("queries FAQ Generic Items and maps only the requested language", async () => {
    const { repository, request } = createRepository([
      faq(),
      faq({ id: "faq-en", payload: { languageCode: "en", sortWeight: 3 } }),
    ]);

    await expect(repository.getBookingFaqs("de-DE")).resolves.toEqual({
      items: [{ id: "faq-1", question: "1. Erste Frage", answer: "Antwort", languageCode: "de", sortWeight: 1 }],
    });
    expect(request).toHaveBeenCalledWith(expect.stringContaining('genericItems(genericType: "FAQ")'));
  });

  it("returns an empty collection when the language has no FAQs", async () => {
    const { repository } = createRepository([faq()]);
    await expect(repository.getBookingFaqs("pl")).resolves.toEqual({ items: [] });
  });

  it("rejects malformed collection envelopes", async () => {
    const request = vi.fn(async () => ({}));
    const repository = new SmartVillageBookingFaqRepository({ client: { request: request as never } });
    await expect(repository.getBookingFaqs("de")).rejects.toMatchObject({ code: "INVALID_UPSTREAM_PAYLOAD", statusCode: 502 });
  });

  it("isolates malformed items and emits safe diagnostics", async () => {
    const { repository, warn } = createRepository([
      faq({ id: "broken", contentBlocks: [] }),
      faq({ id: "valid" }),
    ]);
    await expect(repository.getBookingFaqs("de")).resolves.toMatchObject({ items: [{ id: "valid" }] });
    expect(warn).toHaveBeenCalledWith("Skipping malformed Smart Village FAQ item", { itemId: "broken" });
  });

  it("normalizes missing and invalid weights to zero", async () => {
    const { repository } = createRepository([
      faq({ id: "missing", payload: { languageCode: "de" } }),
      faq({ id: "invalid", payload: { languageCode: "de", sortWeight: "7" } }),
    ]);
    const result = await repository.getBookingFaqs("de");
    expect(result.items.map((item) => item.sortWeight)).toEqual([0, 0]);
  });

  it("sorts by every deterministic comparator tier", async () => {
    const { repository } = createRepository([
      faq({ id: "z", title: "Zebra", payload: { languageCode: "de", sortWeight: 0 } }),
      faq({ id: "ten", title: "10. Zehn", payload: { languageCode: "de", sortWeight: 1 } }),
      faq({ id: "alpha-b", title: "Äpfel", payload: { languageCode: "de", sortWeight: 0 } }),
      faq({ id: "two", title: "2. Zwei", payload: { languageCode: "de", sortWeight: 1 } }),
      faq({ id: "high", title: "Ohne Nummer", payload: { languageCode: "de", sortWeight: 2 } }),
      faq({ id: "alpha-a", title: "Äpfel", payload: { languageCode: "de", sortWeight: 0 } }),
      faq({ id: "plain", title: "Unnummeriert", payload: { languageCode: "de", sortWeight: 1 } }),
    ]);
    const result = await repository.getBookingFaqs("de");
    expect(result.items.map((item) => item.id)).toEqual(["high", "two", "ten", "plain", "alpha-a", "alpha-b", "z"]);
  });
});
