import Database from "better-sqlite3";
import { DB_FILE_PATH } from "../src/config";

const db = new Database(DB_FILE_PATH, { readonly: true });

const q = process.argv[2]?.trim() || "cat";

let words: any[] = db
    .prepare("SELECT * FROM words WHERE LOWER(word) = LOWER(?) LIMIT 1")
    .all(q);


const links: any[] = [];
for (const w of words) {
    const trans = db
        .prepare("SELECT * FROM word_links WHERE word_id = ?")
        .all(w.id);
    links.push(...trans);
}

console.log("Words:", words);
console.log("Translations:", JSON.stringify(links, null, 4));

db.close();
