import type { APIEvent } from "@solidjs/start/server";
import Database from "better-sqlite3";
import type { Translation, SubjectDefinition } from "~/types";

export async function GET(event: APIEvent) {
    const url = new URL(event.request.url);
    const q = (url.searchParams.get("word") ?? "").trim();

    const db = new Database("words.db", { readonly: true });

    // Exact match first
    let subject = db
        .prepare("SELECT * FROM words WHERE LOWER(word) = LOWER(?) LIMIT 1")
        .all(q) as SubjectDefinition[];

    // Fallback to prefix search
    if (subject.length === 0) {
        subject = db
            .prepare("SELECT * FROM words WHERE LOWER(word) LIKE LOWER(?) LIMIT 50")
            .all(`${q}%`) as SubjectDefinition[];
    }

    // Look up translations for each word
    const translations: Translation[] = subject.flatMap((w) =>
        db.prepare("SELECT * FROM translations WHERE word_id = ?").all(w.id) as Translation[]
    );

    db.close();

    // Return both words and translations
    return new Response(
        JSON.stringify({ subject, translations }),
        { headers: { "Content-Type": "application/json" } }
    );
}
