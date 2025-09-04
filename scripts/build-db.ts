import fs from "fs";
import readline from "readline";
import Database from "better-sqlite3";
import { langauges } from "../src/lib/langs";

const targetPOS: string[] = []; // ["noun", "verb"]
const germanicLangs = new Set(
    // [
    //     "en", "de", "nl", "sv", "no", "nn", "da", "is", "fo", "af",
    //     "yi", "ang", "ohg", "non", "got", "nds", "fry", "frr", "frs", "li"
    // ]
    Object.keys(langauges)
);

const db = new Database("words.db");

db.exec(`
CREATE TABLE IF NOT EXISTS words (
  id INTEGER PRIMARY KEY,
  word TEXT NOT NULL,
  lang TEXT NOT NULL,
  pos TEXT,
  etymology TEXT,
  year_start INTEGER,
  year_end INTEGER
);

CREATE TABLE IF NOT EXISTS translations (
  id INTEGER PRIMARY KEY,
  word_id INTEGER NOT NULL REFERENCES words(id),
  translation TEXT NOT NULL,
  lang TEXT NOT NULL,
  year_start INTEGER,
  year_end INTEGER
);
`);

function parseYears(etymologyText?: string): [number | null, number | null] {
    if (!etymologyText) return [null, null];

    let start: number | null = null;
    let end: number | null = null;

    if (/Old English/i.test(etymologyText)) { start = 700; end = 1100; }
    else if (/Middle English/i.test(etymologyText)) { start = 1100; end = 1500; }
    else if (/Modern English/i.test(etymologyText)) { start = 1500; end = 2025; }

    const match = etymologyText.match(/c\.?\s*(\d{3,4})/);
    if (match) { start = parseInt(match[1]); end = start; }

    return [start, end];
}

const insertWord = db.prepare(`
  INSERT INTO words (word, lang, pos, etymology, year_start, year_end)
  VALUES (?, ?, ?, ?, ?, ?)
`);

const insertTrans = db.prepare(`
  INSERT INTO translations (word_id, translation, lang, year_start, year_end)
  VALUES (?, ?, ?, ?, ?)
`);

const insertBatch = db.transaction((entries: any[]) => {
    let translationsInserted = 0;
    let wordsInserted = 0;
    let skippedEmpty = 0;
    let skippedNonGermanic = 0;

    for (const entry of entries) {
        const [yearStart, yearEnd] = parseYears(entry.etymology_text);

        // Filter translations to Germanic and non-empty
        const germanicTranslations = (entry.translations || [])
            .filter((tr: any) => {
                const word = tr.word?.trim();
                return word && germanicLangs.has(tr.lang_code);
            })
            .map((tr: any) => tr.word!.trim());

        if (germanicTranslations.length === 0) {
            skippedNonGermanic++;
            continue; // skip this word entirely
        }

        const info = insertWord.run(
            entry.word,
            entry.lang || "en",
            entry.pos,
            entry.etymology_text || null,
            yearStart,
            yearEnd
        );
        const wordId = info.lastInsertRowid;
        wordsInserted++;

        (entry.translations || []).forEach((tr: any) => {
            const word = tr.word?.trim();
            if (!word) { skippedEmpty++; return; }
            if (!germanicLangs.has(tr.lang_code)) { skippedNonGermanic++; return; }

            insertTrans.run(wordId, word, tr.lang_code, yearStart, yearEnd);
            translationsInserted++;
            if (translationsInserted % 1000 === 0) {
                console.log(`Inserted ${translationsInserted} translations so far...`);
            }
        });
    }

    return { wordsInserted, translationsInserted, skippedEmpty, skippedNonGermanic };
});

async function main() {
    const rl = readline.createInterface({
        input: fs.createReadStream("./data/kaikki.org-dictionary-English.jsonl"),
        crlfDelay: Infinity
    });

    const batchSize = 1000;
    let batch: any[] = [];
    let totalWords = 0;
    let totalTranslations = 0;
    let totalSkippedEmpty = 0;
    let totalSkippedNonGermanic = 0;

    for await (const line of rl) {
        try {
            const entry = JSON.parse(line);
            if (targetPOS.length && !targetPOS.includes(entry.pos)) continue;

            batch.push(entry);
            if (batch.length >= batchSize) {
                const res = insertBatch(batch);
                totalWords += res.wordsInserted;
                totalTranslations += res.translationsInserted;
                totalSkippedEmpty += res.skippedEmpty;
                totalSkippedNonGermanic += res.skippedNonGermanic;
                console.log(`Inserted ${totalWords} words, ${totalTranslations} translations total`);
                batch = [];
            }
        } catch (err) {
            console.error("Failed to parse line:", err);
        }
    }

    if (batch.length > 0) {
        const res = insertBatch(batch);
        totalWords += res.wordsInserted;
        totalTranslations += res.translationsInserted;
        totalSkippedEmpty += res.skippedEmpty;
        totalSkippedNonGermanic += res.skippedNonGermanic;
    }

    console.log("Done!");
    console.log(`Total words inserted: ${totalWords}`);
    console.log(`Total translations inserted: ${totalTranslations}`);
    console.log(`Skipped empty translations: ${totalSkippedEmpty}`);
    console.log(`Skipped non-Germanic translations or words: ${totalSkippedNonGermanic}`);
}

main();
