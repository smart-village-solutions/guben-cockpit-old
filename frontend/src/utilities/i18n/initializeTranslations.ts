import { initReactI18next } from 'react-i18next';
import LanguageDetector from "i18next-browser-languagedetector";
import resourcesToBackend from 'i18next-resources-to-backend';
import { Language } from './Languages';
import i18next from 'i18next';
import { FetchInterceptor } from "@/utilities/fetchApiExtensions";

const localeModules = import.meta.glob("../../assets/locales/*/*.json");

const loadLocaleModule = async (language: string, namespace: string) => {
  const loader = localeModules[`../../assets/locales/${language}/${namespace}.json`];

  if (!loader) {
    throw new Error(`Missing locale module for ${language}/${namespace}`);
  }

  const module = await loader();
  return "default" in module ? module.default : module;
};

i18next
  .use(initReactI18next)
  .use(LanguageDetector)
  .use(resourcesToBackend(loadLocaleModule))
  .init({
    load: "languageOnly",
    ns: ["common"],
    defaultNS: "common",
    fallbackNS: "common",
    supportedLngs: Object.keys(Language),
    fallbackLng: Language.de,
    debug: import.meta.env.DEV,

    interpolation: {
      escapeValue: false, // not needed for react as it escapes by default
    },
    saveMissing: import.meta.env.DEV,
    missingKeyHandler: (lngs, ns, key) =>
      console.error(`Translation for key '${ns}/${key}' in languages: ${lngs} is missing`)
  });

// Correct way to handle language changes
i18next.on("languageChanged", (lng) => {
  console.log("langauge changed", lng)
  FetchInterceptor.setHeader("Accept-Language", lng);
});
