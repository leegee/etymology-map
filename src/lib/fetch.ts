import { logger } from "../logger";
import { stmtFindExact, stmtFindTranslations } from "../db";
import { normalizeWords, normaliseSubjects } from "./normalizeWords";

export const STATIC_BASE = "/static-data";

export function pathForhWord(word: string): string {
    const clean = word.replace(/[^a-z0-9]+/gi, "_").toLowerCase();
    const dir = dirForhWord(word);
    return `${dir}/${clean}.json`;
}

export function dirForhWord(word: string): string {
    const clean = word.replace(/[^a-z0-9]+/gi, "_").toLowerCase();
    const first = clean[0] ?? "_";
    const second = clean[1] ?? "_";

    return `${first}/${first}${second}/`;
}

export async function fetchJSON<T>(url: string): Promise<T> {
    try {
        const res = await fetch(url);

        if (!res.ok) {
            let body: string | null = null;
            try { body = await res.text(); } catch { }

            logger.error("Fetch failed", {
                fetchUrl: url,
                status: res.status,
                statusText: res.statusText,
                body,
            });
            throw new Error(`HTTP ${res.status} ${res.statusText}`);
        }

        const data = (await res.json()) as T;
        logger.info("Fetch successful", { fetchUrl: url });
        return data;

    } catch (err: any) {
        logger.error("Error during fetch", {
            url,
            message: err.message,
            stack: err.stack,
        });
        throw err;
    }
}

export type WordsResponse = {
    subject: any[];
    translations: any[];
};

export async function fetchWords(word: string): Promise<WordsResponse> {
    logger.debug('fetchWords enter with', word);
    const wordRows = await stmtFindExact.all(word);
    logger.debug('fetchWords got wordRows', wordRows);

    if (!wordRows.length) return { subject: [], translations: [] };

    const wordRow = wordRows[0];
    const translationsRaw = await stmtFindTranslations.all(wordRow.id);

    logger.debug('fetchWords got translationRows', translationsRaw);

    const translations = normalizeWords(translationsRaw);
    const subject = normaliseSubjects([wordRow]);

    return { subject, translations };
}
