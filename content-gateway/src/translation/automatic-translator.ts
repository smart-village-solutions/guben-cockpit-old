import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile, rename } from "node:fs/promises";
import { join } from "node:path";

type Options = {
  url?: string;
  apiKey?: string;
  cacheDir?: string;
  timeoutMs?: number;
  fetch?: typeof fetch;
};

// Only editorial fields: never IDs, URLs, addresses, provider/organizer names or credits.
const editorialFields = new Set(["title", "description", "fullText", "imageCaption", "imageAlt", "question", "answer", "dropdownTitle", "tabTitle"]);

export class AutomaticTranslator {
  private readonly cache = new Map<string, string>();
  private readonly pending = new Map<string, Promise<string>>();

  public constructor(private readonly options: Options) {}

  public async text(text: string, language: string): Promise<string> {
    const target = language.toLowerCase().split("-")[0];
    if (!this.options.url || !["en", "pl"].includes(target) || !text.trim()) return text;
    const key = createHash("sha256").update(JSON.stringify(["v2", this.options.url, "auto", target, text])).digest("hex");
    const cached = this.cache.get(key);
    if (cached !== undefined) return cached;
    const pending = this.pending.get(key);
    if (pending) return pending;
    const task = this.load(text, target, key).finally(() => this.pending.delete(key));
    this.pending.set(key, task);
    return task;
  }

  private remember(key: string, value: string) {
    if (this.cache.size >= 2000) this.cache.delete(this.cache.keys().next().value!);
    this.cache.set(key, value);
    return value;
  }

  private async load(text: string, target: string, key: string): Promise<string> {
    const file = this.options.cacheDir ? join(this.options.cacheDir, `${key}.json`) : undefined;
    if (file) {
      try {
        const value: unknown = JSON.parse(await readFile(file, "utf8"));
        if (typeof value === "string" && value.trim()) return this.remember(key, value);
      } catch { /* A missing or damaged cache entry is regenerated. */ }
    }
    try {
      // Translate text segments only. Keep markup, attributes, links and entities byte-for-byte.
      const parts = text.split(/(<[^>]*>|&(?:#\d+|#x[\da-f]+|\w+);|https?:\/\/[^\s<>]+|[\w.+-]+@[\w.-]+\.[a-z]{2,})/gi);
      const indexes = parts.flatMap((part, index) => index % 2 === 0 && /\p{L}/u.test(part) ? [index] : []);
      if (indexes.length === 0) return text;
      const response = await (this.options.fetch ?? fetch)(this.options.url!, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: AbortSignal.timeout(this.options.timeoutMs ?? 3000),
        body: JSON.stringify({
          q: indexes.map((index) => parts[index].trim()), source: "auto", target, format: "text",
          ...(this.options.apiKey ? { api_key: this.options.apiKey } : {}),
        }),
      });
      if (!response.ok) return text;
      const payload = await response.json() as { translatedText?: unknown };
      const translated = typeof payload.translatedText === "string" ? [payload.translatedText] : payload.translatedText;
      if (!Array.isArray(translated) || translated.length !== indexes.length || !translated.every((value) => typeof value === "string" && value.trim())) return text;
      const html = /<[^>]*>/.test(text);
      indexes.forEach((index, offset) => {
        const original = parts[index];
        let value = translated[offset] as string;
        if (html) value = value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
        parts[index] = `${original.match(/^\s*/)?.[0] ?? ""}${value}${original.match(/\s*$/)?.[0] ?? ""}`;
      });
      const value = parts.join("");
      if (file) {
        try {
          await mkdir(this.options.cacheDir!, { recursive: true });
          const temporary = `${file}.${crypto.randomUUID()}.tmp`;
          await writeFile(temporary, JSON.stringify(value), { mode: 0o600 });
          await rename(temporary, file);
        } catch { /* Translation remains available if the cache volume is unavailable. */ }
      }
      return this.remember(key, value);
    } catch { return text; } // Failed translations are deliberately not cached.
  }

  public async fillMissing<T>(source: T, target: T, language: string): Promise<T> {
    const fill = async (original: unknown, localized: unknown, field = ""): Promise<unknown> => {
      if (typeof original === "string" && editorialFields.has(field)) {
        return typeof localized === "string" && localized.trim() ? localized : this.text(original, language);
      }
      if (original && localized && typeof original === "object" && typeof localized === "object" && !Array.isArray(original)) {
        const result = { ...localized } as Record<string, unknown>;
        for (const [key, value] of Object.entries(original)) result[key] = await fill(value, result[key], key);
        return result;
      }
      return localized;
    };
    return await fill(source, target) as T;
  }

  /** Fill only missing fields in explicit language dictionaries, without changing upstream rows. */
  public async translations<T>(value: T, language: string, fallback = "de"): Promise<T> {
    if (!value || typeof value !== "object") return value;
    if (Array.isArray(value)) return await Promise.all(value.map((entry) => this.translations(entry, language, fallback))) as T;
    const entries = await Promise.all(Object.entries(value).map(async ([key, entry]) => {
      if (["translations", "button_translations"].includes(key) && entry && typeof entry === "object") {
        const dictionary = entry as Record<string, Record<string, unknown>>;
        const original = dictionary[fallback] ?? {};
        const target = { ...dictionary[language] };
        for (const [field, text] of Object.entries(original)) {
          const missing = target[field] == null || (typeof target[field] === "string" && !(target[field] as string).trim());
          if (missing && typeof text === "string") {
            target[field] = ["Title", "Description", "FullText", "ImageAlt", "ImageCaption"].includes(field)
              ? await this.text(text, language) : text;
          }
        }
        return [key, { ...dictionary, [language]: target }];
      }
      return [key, await this.translations(entry, language, fallback)];
    }));
    return Object.fromEntries(entries) as T;
  }

  public async content<T>(content: T, language: string, preserveTitle = false): Promise<T> {
    const visit = async (value: unknown, field = "", parent = ""): Promise<unknown> => {
      if (typeof value === "string") return (editorialFields.has(field) || (field === "name" && ["categories", "priceInformations"].includes(parent))) && !(preserveTitle && field === "title") ? this.text(value, language) : value;
      if (Array.isArray(value)) return Promise.all(value.map((entry) => visit(entry, "", field)));
      if (value && typeof value === "object") {
        const entries = await Promise.all(Object.entries(value).map(async ([key, entry]) => [key, await visit(entry, key, field || parent)]));
        return Object.fromEntries(entries);
      }
      return value;
    };
    return await visit(content) as T;
  }
}
