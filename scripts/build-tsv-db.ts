/**
 * Creates an SQLite DB of Gerard de Melo's etymwn.tsv and lists langs that are not listed in iso-639-3
 */

import fs from "fs";
import readline from "readline";
import Database from "better-sqlite3";
import { iso6393 } from "iso-639-3"; // npm install iso-639-3

// Paths
const TSV_PATH = "./data/etymwn.tsv";
const OFFLINE_DB_PATH = "./data/etymwn_offline.db";

// Load ISO 639-3 codes
const iso3Map = Object.fromEntries(iso6393.map(l => [l.iso6393, l.iso6393]));
const unknownLangs = new Set<string>();

// Reset offline DB
if (fs.existsSync(OFFLINE_DB_PATH)) fs.unlinkSync(OFFLINE_DB_PATH);
const offlineDB = new Database(OFFLINE_DB_PATH);

offlineDB.exec(`
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

// Prepare statements
const insertWord = offlineDB.prepare(`INSERT INTO words (word, lang, pos, etymology) VALUES (?, ?, ?, ?)`);
const insertLink = offlineDB.prepare(`INSERT INTO word_links (word_id, linked_word, lang, type) VALUES (?, ?, ?, ?)`);

// Cache to avoid repeated SELECTs
const wordIdMap = new Map<string, number>();

// Transactional batch insert
const insertBatch = offlineDB.transaction((batch: string[]) => {
  for (const line of batch) {
    if (!line.trim() || line.startsWith("#")) continue;

    const [source, relation, target] = line.split("\t");
    if (!source || !relation || !target) continue;
    if (!relation.startsWith("rel:etymology")) continue;

    const [srcWordRaw, srcLangRaw] = source.split("_");
    const [tgtWordRaw, tgtLangRaw] = target.split("_");

    if (!srcWordRaw || !tgtWordRaw) continue;

    // Resolve languages
    let srcLang = iso3Map[srcLangRaw] || "und";
    let tgtLang = iso3Map[tgtLangRaw] || "und";
    if (srcLang === "und") unknownLangs.add(srcLangRaw);
    if (tgtLang === "und") unknownLangs.add(tgtLangRaw);

    // Get or insert source word
    const srcKey = `${srcWordRaw}_${srcLang}`;
    let wordId = wordIdMap.get(srcKey);
    if (!wordId) {
      const info = insertWord.run(srcWordRaw, srcLang, null, null);
      wordId = Number(info.lastInsertRowid);
      wordIdMap.set(srcKey, wordId);
    }

    // Insert link
    insertLink.run(wordId, tgtWordRaw, tgtLang, "etymology");
  }
});

async function importTSV() {
  const rl = readline.createInterface({ input: fs.createReadStream(TSV_PATH), crlfDelay: Infinity });
  let batch: string[] = [];
  let count = 0;
  const batchSize = 10000;

  for await (const line of rl) {
    batch.push(line);
    if (batch.length >= batchSize) {
      insertBatch(batch);
      count += batch.length;
      console.log(`Imported ${count} lines...`);
      batch = [];
    }
  }

  if (batch.length) {
    insertBatch(batch);
    count += batch.length;
    console.log(`Imported ${count} lines...`);
  }

  console.log(`# TSV import complete.`);
  console.log(`# Unknown languages:`, Array.from(unknownLangs).join(", "));
}

(async () => {
  console.time("TSV import");
  await importTSV();
  console.timeEnd("TSV import");
})();
