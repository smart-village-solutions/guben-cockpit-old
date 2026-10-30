import type { Event } from "../../../shared/public-content/contracts.js";

// German dictionary collation for every UI language: case and accents (including
// umlauts) compare equally, digit sequences compare numerically. NFKC also folds
// compatibility forms. Only leading punctuation/whitespace is removed; punctuation
// inside a title remains significant. Equal titles use the locale-independent ID
// order. Descending reverses the complete order, including this tie-breaker.
const titleCollator = new Intl.Collator("de", {
  usage: "sort",
  sensitivity: "base",
  numeric: true,
  ignorePunctuation: false,
});
const titleKey = (title: string) => title.normalize("NFKC").replace(/^[\p{P}\s]+/u, "");

export const compareEventTitles = (left: Event, right: Event): number =>
  titleCollator.compare(titleKey(left.title), titleKey(right.title)) ||
  (left.id < right.id ? -1 : left.id > right.id ? 1 : 0);

// Occurrence IDs include date/time; distinct occurrences and equal titles survive.
// Keep the first matching occurrence after filtering, before sort and pagination.
export const uniqueEvents = (events: Event[]): Event[] => {
  const seen = new Set<string>();
  return events.filter((event) => {
    if (seen.has(event.id)) return false;
    seen.add(event.id);
    return true;
  });
};
