import Database from "better-sqlite3";

export const GET = async ({ url }: { url: URL }) => {
    const q = url.searchParams.get("word") ?? "";
    const db = new Database("words.db", { readonly: true });
    const rows = db
        .prepare(`SELECT * FROM words WHERE word LIKE ? LIMIT 50`)
        .all(`${q}%`);
    db.close();

    return new Response(JSON.stringify(rows), {
        headers: { "Content-Type": "application/json" },
    });
};
