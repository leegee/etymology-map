import Database from "better-sqlite3";

// Open the database in read-only mode
const db = new Database("words.db", { readonly: true });

const q = "craft";

let words: any[] = db
    .prepare("SELECT * FROM words WHERE LOWER(word) = LOWER(?) LIMIT 1")
    .all(q);

if (words.length === 0) {
    words = db
        .prepare("SELECT * FROM words WHERE LOWER(word) LIKE LOWER(?) LIMIT 50")
        .all(`${q}%`);
}

console.log("Words:", words);

const translations: any[] = [];
for (const w of words) {
    const trans = db
        .prepare("SELECT * FROM translations WHERE word_id = ?")
        .all(w.id);
    translations.push(...trans);
}

console.log("Translations:", translations);

db.close();
