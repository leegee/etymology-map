import { logger } from "../logger";

export const STATIC_BASE = "/static-data";

const useStatic = true;

export async function fetchJSON<T>(url: string): Promise<T> {

    const fetchUrl = useStatic ? `${STATIC_BASE}${url}` : url;

    try {
        const res = await fetch(url);

        if (!res.ok) {
            let body: string | null = null;
            try { body = await res.text(); } catch { }

            logger.error("Fetch failed", {
                fetchUrl,
                status: res.status,
                statusText: res.statusText,
                body,
            });
            throw new Error(`HTTP ${res.status} ${res.statusText}`);
        }

        const data = (await res.json()) as T;
        logger.info("Fetch successful", { fetchUrl });
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
