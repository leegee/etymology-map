/**
 * Creates an SQLite DB of Gerard de Melo's etymwn.tsv
 * and lists langs that are not listed in iso-639-3
 */

import fs from "fs";
import readline from "readline";
import Database from "better-sqlite3";
import { iso6393 } from "iso-639-3"; // npm install iso-639-3

const TSV_PATH = "./data/etymwn.tsv";
const OFFLINE_DB_PATH = "./data/etymwn_offline.db";

// Map ISO 639-3 codes for lookup
const iso3Map = Object.fromEntries(iso6393.map(l => [l.iso6393, l.iso6393]));
const unknownLangs = new Set<string>();

if (fs.existsSync(OFFLINE_DB_PATH)) fs.unlinkSync(OFFLINE_DB_PATH);
const db = new Database(OFFLINE_DB_PATH);

db.exec(`
CREATE TABLE words (
  id INTEGER PRIMARY KEY,
  word TEXT NOT NULL,
  lang TEXT NOT NULL,
  pos TEXT,
  etymology TEXT
);
CREATE TABLE word_links (
  id INTEGER PRIMARY KEY,
  word_id INTEGER NOT NULL REFERENCES words(id),
  linked_word TEXT NOT NULL,
  lang TEXT NOT NULL,
  type TEXT NOT NULL
);
`);

const insertWord = db.prepare(`INSERT INTO words (word, lang, pos, etymology) VALUES (?, ?, ?, ?)`);
const insertLink = db.prepare(`INSERT INTO word_links (word_id, linked_word, lang, type) VALUES (?, ?, ?, ?)`);
const getWordId = db.prepare(`SELECT id FROM words WHERE word = ? AND lang = ?`);

async function importTSV() {
  const rl = readline.createInterface({ input: fs.createReadStream(TSV_PATH), crlfDelay: Infinity });
  let count = 0;

  for await (const line of rl) {
    if (!line.trim() || line.startsWith("#")) continue;

    const [source, relation, target] = line.split("\t");
    if (!source || !relation || !target) continue;
    if (!relation.startsWith("rel:etymology")) continue;

    const [srcWordRaw, srcLangRaw] = source.split("_");
    const [tgtWordRaw, tgtLangRaw] = target.split("_");

    // Resolve languages
    let srcLang = iso3Map[srcLangRaw] || "und";
    let tgtLang = iso3Map[tgtLangRaw] || "und";
    if (srcLang === "und") unknownLangs.add(srcLangRaw);
    if (tgtLang === "und") unknownLangs.add(tgtLangRaw);

    // Ensure source word exists
    let wordRow: any = getWordId.get(srcWordRaw, srcLang);
    if (!wordRow) {
      const info = insertWord.run(srcWordRaw, srcLang, null, null);
      wordRow = { id: Number(info.lastInsertRowid) };
    }

    insertLink.run(wordRow.id, tgtWordRaw, tgtLang, "etymology");
    count++;

    if (count % 10000 === 0) console.log(`Imported ${count} links...`);
  }

  console.log(`# TSV import complete: ${count} links.`);
  if (unknownLangs.size) console.log(`# Unknown languages:`, Array.from(unknownLangs).join(", "));
}

importTSV().catch(err => console.error(err));
