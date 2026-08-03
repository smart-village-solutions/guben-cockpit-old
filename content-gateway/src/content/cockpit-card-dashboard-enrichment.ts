import type {
  DashboardContent,
  DashboardDropdown,
  PublicContentHomeCard,
} from "../../../shared/public-content/contracts.js";
import type { CategorizedCockpitCard } from "./smart-village-cockpit-card-repository.js";

type Warn = (message: string, context: Record<string, unknown>) => void;

export const normalizeCockpitCardCategory = (value: string) => value.trim().toLocaleLowerCase();

export const flattenedDashboardCards = (
  dropdowns: DashboardDropdown[],
): PublicContentHomeCard[] =>
  dropdowns.flatMap((dropdown) =>
    dropdown.tabs.flatMap((tab) =>
      tab.informationCards.map((card, cardIndex) => ({
        ...card,
        dropdownId: dropdown.id,
        dropdownTitle: dropdown.title,
        tabId: tab.id,
        tabTitle: tab.title,
        sequence: cardIndex + 1,
      })),
    ),
  );

export const enrichDashboardWithCockpitCards = (
  dashboard: DashboardContent,
  cards: CategorizedCockpitCard[],
  warn?: Warn,
): { dashboard: DashboardContent; usedSmartVillageCards: boolean } => {
  const tabNames = new Set(
    dashboard.dropdowns.flatMap((dropdown) =>
      dropdown.tabs.map((tab) => normalizeCockpitCardCategory(tab.title)),
    ),
  );
  const matchedCards = cards.filter((item) => {
    const matched = tabNames.has(normalizeCockpitCardCategory(item.categoryName));
    if (!matched) {
      warn?.("Skipping Smart Village Cockpit Card with unknown category", {
        itemId: item.card.id,
        categoryName: item.categoryName,
        languageCode: item.languageCode,
      });
    }
    return matched;
  });

  if (matchedCards.length === 0) return { dashboard, usedSmartVillageCards: false };

  const cardsByCategory = new Map<string, CategorizedCockpitCard[]>();
  for (const item of matchedCards) {
    const category = normalizeCockpitCardCategory(item.categoryName);
    cardsByCategory.set(category, [...(cardsByCategory.get(category) ?? []), item]);
  }

  return {
    usedSmartVillageCards: true,
    dashboard: {
      ...dashboard,
      dropdowns: dashboard.dropdowns.map((dropdown) => ({
        ...dropdown,
        tabs: dropdown.tabs.map((tab) => ({
          ...tab,
          informationCards: (cardsByCategory.get(normalizeCockpitCardCategory(tab.title)) ?? [])
            .map((item) => item.card),
        })),
      })),
    },
  };
};
