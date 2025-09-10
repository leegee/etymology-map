import Database from "better-sqlite3";
import { DB_FILE_PATH, OFFLINE_DB_PATH } from "./config";

const db = new Database(DB_FILE_PATH, { readonly: true });
const tsvDb = new Database(OFFLINE_DB_PATH, { readonly: true });

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


let tsvWords: any[] = tsvDb
    .prepare("SELECT * FROM words WHERE LOWER(word) = LOWER(?) LIMIT 1")
    .all(q);

console.log("Words:", tsvWords);

db.close();
