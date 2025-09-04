import type { APIEvent } from "@solidjs/start/server";
import Database from "better-sqlite3";
import type { Translation, WordRow } from "~/types";

export async function GET(event: APIEvent) {
    const url = new URL(event.request.url);
    const q = (url.searchParams.get("word") ?? "").trim();

    const db = new Database("words.db", { readonly: true });

    // Exact match first
    let words = db
        .prepare("SELECT * FROM words WHERE LOWER(word) = LOWER(?) LIMIT 1")
        .all(q) as WordRow[];

    // Fallback to prefix search
    if (words.length === 0) {
        words = db
            .prepare("SELECT * FROM words WHERE LOWER(word) LIKE LOWER(?) LIMIT 50")
            .all(`${q}%`) as WordRow[];
    }

    const translations: Translation[] = words.flatMap((w) =>
        db.prepare("SELECT * FROM translations WHERE word_id = ?").all(w.id) as Translation[]
    );

    db.close();

    return new Response(JSON.stringify(translations), {
        headers: { "Content-Type": "application/json" },
    });
}
