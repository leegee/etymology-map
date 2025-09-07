import { logger } from "../logger";

export async function fetchJSON<T>(url: string): Promise<T> {
    try {
        const res = await fetch(url);

        if (!res.ok) {
            let body: string | null = null;
            try { body = await res.text(); } catch { }

            logger.error("Fetch failed", {
                url,
                status: res.status,
                statusText: res.statusText,
                body,
            });
            throw new Error(`HTTP ${res.status} ${res.statusText}`);
        }

        const data = (await res.json()) as T;
        logger.info("Fetch successful", { url });
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
