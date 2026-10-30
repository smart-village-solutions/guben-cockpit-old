// Shared by gateway and booking search. All query tokens must occur in the
// title; token order is irrelevant and partial words remain supported.
export const normalizeEventSearch = (value: string): string =>
  value.normalize("NFKC").toLocaleLowerCase("de")
    .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
    .replace(/[\p{P}\p{Z}\s]+/gu, " ").trim();

export const createEventTitleMatcher = (query: string) => {
  const tokens = normalizeEventSearch(query).split(" ").filter(Boolean);
  return (title: string): boolean => {
    const normalized = normalizeEventSearch(title);
    return tokens.every((token) => normalized.includes(token));
  };
};
