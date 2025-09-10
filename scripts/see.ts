import Database from "better-sqlite3";
import { DB_FILE_PATH, OFFLINE_DB_PATH } from "./config";

const db = new Database(DB_FILE_PATH, { readonly: true });
const tsvDb = new Database(OFFLINE_DB_PATH, { readonly: true });

const q = process.argv[2]?.trim() || "cat";

const words = db.prepare("SELECT * FROM words WHERE LOWER(word) = LOWER(?)").all(q);

const wordLinksStmt = db.prepare("SELECT * FROM word_links WHERE word_id = ?");
const links = words.flatMap((w: any) => wordLinksStmt.all(w.id));

console.log("Words:", JSON.stringify(words, null, 4));
console.log("Translations:", JSON.stringify(links, null, 4));

const tsvWords = tsvDb.prepare("SELECT * FROM words WHERE LOWER(word) = LOWER(?) LIMIT 1").all(q);
console.log("TSV Words:", JSON.stringify(tsvWords, null, 4));

db.close();
tsvDb.close();
