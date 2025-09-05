import Database from "better-sqlite3";
import { DB_FILE_PATH } from "../src/config";

const db = new Database(DB_FILE_PATH, { readonly: true });

const queries = [
    `SELECT COUNT(*) AS pie_words FROM words WHERE lang = 'pie';`,
    `SELECT COUNT(*) AS pie_translations FROM translations WHERE lang = 'pie';`,
    `SELECT word, lang, year_start, year_end FROM words WHERE lang = 'pie' LIMIT 10;`,
    `SELECT translation, lang, word_id, year_start, year_end FROM translations WHERE lang = 'pie' LIMIT 10;`
];

for (const q of queries) {
    const result = db.prepare(q).all();
    console.log("Result:", result);
}

db.close();
