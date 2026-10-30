import { contentGatewayBaseUrl } from "@/public-content/source";
import { Language } from "./i18n/Languages";
import i18next from "i18next";
import DOMPurify from "dompurify";

const cache: Record<string, string> = {};
const htmlCache: Record<string, string> = {};
const completeHtmlTranslations = new Set<string>();

function collectTextNodes(node: ChildNode, nodes: Text[] = []) {
    if (node.nodeType === Node.TEXT_NODE && node.textContent?.trim()) {
        nodes.push(node as Text);
    } else {
        node.childNodes.forEach((child) => collectTextNodes(child, nodes));
    }
    return nodes;
}

function normalizeTranslations(payload: unknown): string[] | null {
    if (!payload || typeof payload !== "object") {
        return null;
    }

    const translatedText = (payload as { translatedText?: unknown }).translatedText;
    if (Array.isArray(translatedText) && translatedText.every((value) => typeof value === "string")) {
        return translatedText;
    }

    if (typeof translatedText === "string") {
        return [translatedText];
    }

    return null;
}

async function requestBatch(texts: string[], targetLang: string): Promise<string[]> {
    let results = [...texts];
    for (let attempt = 0; attempt < 10; attempt++) {
        try {
            const response = await fetch(new URL("/api/content/translate", contentGatewayBaseUrl), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ q: texts, target: targetLang.split("-")[0].toLowerCase() }),
            });
            if (!response.ok) break;
            const translated = normalizeTranslations(await response.json());
            if (!translated || translated.length !== texts.length) break;
            results = translated.map((text, index) => text.trim() && text !== texts[index] ? text : results[index]);
            if (response.headers?.get("X-Translation-Pending") !== "1" || attempt === 9) break;
        } catch { break; }
        await new Promise((resolve) => setTimeout(resolve, 1500));
    }
    return results;
}

async function requestTranslations(texts: string[], targetLang: string): Promise<string[]> {
    const results = [...texts];
    for (let start = 0; start < texts.length; start += 20) {
        const batch = texts.slice(start, start + 20);
        const indexes = batch.flatMap((text, index) => text.length <= 20000 ? [index] : []);
        if (indexes.length === 0) continue;
        const translated = await requestBatch(indexes.map((index) => batch[index]), targetLang);
        indexes.forEach((index, offset) => { results[start + index] = translated[offset]; });
    }
    return results;
}

export async function translateBatchedMultiple(texts: string[], targetLang: string) {
    const results: string[] = [];
    const untranslated: { index: number; text: string }[] = [];

    texts.forEach((text, i) => {
        const cacheKey = `${text}_${targetLang}`;
        if (cache[cacheKey]) {
            results[i] = cache[cacheKey];
        } else {
            untranslated.push({ index: i, text });
        }
    });

    if (untranslated.length === 0) return results;

    const textsToTranslate = untranslated.map(({ text }) => text);

    const translatedTexts = await requestTranslations(textsToTranslate, targetLang);

    untranslated.forEach(({ index, text }, i) => {
        const translated = translatedTexts?.[i] ?? text;
        const cacheKey = `${text}_${targetLang}`;
        if (translatedTexts?.[i] && translated !== text) cache[cacheKey] = translated;
        results[index] = translated;
    });

    return results;
}

export async function translateHtmlBatchedMultiple(htmls: string[], targetLang: string) {
    const results: string[] = [];
    const untranslated: { index: number; text: string }[] = [];

    htmls.forEach((html, i) => {
        const cacheKey = `${html}_${targetLang}`;
        if (htmlCache[cacheKey] && completeHtmlTranslations.has(cacheKey)) {
            results[i] = htmlCache[cacheKey];
        } else {
            untranslated.push({ index: i, text: html });
        }
    });

    if (untranslated.length === 0) return results;

    const allTexts: string[][] = untranslated.map(({ text }) => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(`<div>${text}</div>`, "text/html");
        const root = doc.body.firstElementChild!;

        const nodes = collectTextNodes(root);
        return nodes.map((n) => n.textContent!.trim());
    });

    const flatTexts = allTexts.flat();
    if (!flatTexts.length) {
        untranslated.forEach(({ index, text }) => {
            htmlCache[`${text}_${targetLang}`] = text;
            results[index] = text;
        });
        return results;
    }

    const translatedTexts = await requestTranslations(flatTexts, targetLang);

    let counter = 0;
    untranslated.forEach(({ index, text }) => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(`<div>${text}</div>`, "text/html");
        const root = doc.body.firstElementChild!;
        const nodes = collectTextNodes(root);
        let changed = false;
        let complete = true;
        nodes.forEach((node) => {
            const original = node.textContent ?? "";
            const translated = translatedTexts[counter++] ?? original.trim();
            if (translated !== original.trim()) changed = true;
            else complete = false;
            const leadingWhitespace = original.slice(0, original.length - original.trimStart().length);
            const trailingWhitespace = original.slice(original.trimEnd().length);
            node.textContent = `${leadingWhitespace}${translated}${trailingWhitespace}`;
        });
        const translatedHTML = root.innerHTML;
        const cacheKey = `${text}_${targetLang}`;
        if (changed && translatedHTML !== text) htmlCache[cacheKey] = translatedHTML;
        if (complete) completeHtmlTranslations.add(cacheKey);
        else completeHtmlTranslations.delete(cacheKey);
        results[index] = translatedHTML;
    });

    return results;
}

export function TranslatedText({ text }: Readonly<{ text: string }>) {
    const currentLang = i18next.language as Language;
    
    if (currentLang === "de") return text;

    const cacheKey = `${text}_${currentLang}`;
    const translation = cache[cacheKey] ?? text;

    return <>{translation}</>;
}

export function TranslatedHtml({ text, className }: Readonly<{ text: string; className?: string }>) {
    const currentLang = i18next.language as Language;

    if (currentLang === "de") return <div className={className} dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(text) }} />;

    const cacheKey = `${text}_${currentLang}`;
    const translation = htmlCache[cacheKey] ?? text;

    return <div className={className} dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(translation) }} />;
}
