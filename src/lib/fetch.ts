import { logger } from "../logger";

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
