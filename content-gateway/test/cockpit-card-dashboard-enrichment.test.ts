import { describe, expect, it, vi } from "vitest";

import {
  enrichDashboardWithCockpitCards,
  flattenedDashboardCards,
} from "../src/content/cockpit-card-dashboard-enrichment.js";
import { mockDashboardContent } from "../src/content/mock-data.js";

const apiCard = (id: string, categoryName: string, sortWeight = 0) => ({
  categoryName,
  languageCode: "de",
  sortWeight,
  card: {
    id,
    title: `API ${id}`,
    description: null,
    imageUrl: null,
    imageAlt: null,
    button: null,
  },
});

describe("Cockpit Card dashboard enrichment", () => {
  it("matches normalized category names, replaces all local cards, and keeps input immutable", () => {
    const original = structuredClone(mockDashboardContent);
    const tabTitle = mockDashboardContent.dropdowns[0]!.tabs[0]!.title;
    const result = enrichDashboardWithCockpitCards(mockDashboardContent, [
      apiCard("api-1", `  ${tabTitle.toUpperCase()}  `),
    ]);

    expect(result.usedSmartVillageCards).toBe(true);
    expect(result.dashboard.dropdowns[0]!.tabs[0]!.informationCards.map(({ id }) => id)).toEqual(["api-1"]);
    expect(mockDashboardContent).toEqual(original);
  });

  it("warns about unknown categories and retains the complete local backup when none match", () => {
    const warn = vi.fn();
    const result = enrichDashboardWithCockpitCards(
      mockDashboardContent,
      [apiCard("unknown", "Neue Kategorie")],
      warn,
    );

    expect(result).toEqual({ dashboard: mockDashboardContent, usedSmartVillageCards: false });
    expect(warn).toHaveBeenCalledWith(
      "Skipping Smart Village Cockpit Card with unknown category",
      expect.objectContaining({ itemId: "unknown", categoryName: "Neue Kategorie" }),
    );
  });

  it("derives flattened public cards from enriched tabs", () => {
    const tabTitle = mockDashboardContent.dropdowns[0]!.tabs[0]!.title;
    const { dashboard } = enrichDashboardWithCockpitCards(mockDashboardContent, [apiCard("api-1", tabTitle)]);

    expect(flattenedDashboardCards(dashboard.dropdowns)[0]).toMatchObject({
      id: "api-1",
      dropdownId: mockDashboardContent.dropdowns[0]!.id,
      tabId: mockDashboardContent.dropdowns[0]!.tabs[0]!.id,
      sequence: 1,
    });
  });
});
