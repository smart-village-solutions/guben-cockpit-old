import i18next from "i18next";

export const getCurrentLocale = () => {
  const language = (i18next.resolvedLanguage ?? i18next.language ?? "de").split("-")[0];
  return ({ de: "de-DE", en: "en-GB", pl: "pl-PL" } as Record<string, string>)[language] ?? "de-DE";
};

export const formatCurrency = (amount: number) =>
  new Intl.NumberFormat(getCurrentLocale(), { style: "currency", currency: "EUR" }).format(amount);
