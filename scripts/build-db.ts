import fs from "fs";
import readline from "readline";
import Database from "better-sqlite3";
import { DB_FILE_PATH } from "../src/config";
import { languages } from "../src/lib/langs";

const targetPOS: string[] = []; // ["noun", "verb"]

// normalize word language names to ISO codes
const langMap: Record<string, string> = {
    english: "en",
    german: "de",
    dutch: "nl",
    olddutch: "nl",
    swedish: "sv",
    norwegian: "nn",
    danish: "da",
    icelandic: "is",
    faroese: "fo",
    afrikaans: "af",
    yiddish: "yi",
    oldenglish: "ang",
    oldhighgerman: "ohg",
    oldnorse: "non",
    gothic: "got",
    lowgerman: "nds",
    frisian: "fry",
    northfrisian: "frr",
    eastfrisian: "frs",
    limburgish: "li",
    latin: "la",
    latelate: "lla",
    ancientgreek: "grc",
    moderngreek: "el",
    coptic: "cop",
    egyptian: "egy",
    "proto": "pie",
    "proto-indo-european": "pie",
    "proto-germanic": "pgm",
};

// helper: detect etymology-only languages from text
function detectEtymologyLang(etymologyText?: string): string | null {
    if (!etymologyText) return null;
    const text = etymologyText.toLowerCase();

    for (const [key, code] of Object.entries(langMap)) {
        if (text.includes(key)) return code;
    }
    return null;
}

function parseYears(etymologyText?: string, langCode?: string): [number | null, number | null] {
    if (!etymologyText && !langCode) return [null, null];

    const match = etymologyText?.match(/c\.?\s*(\d{3,4})/);
    if (match) {
        const y = parseInt(match[1]);
        return [y, y];
    }

    if (langCode && languages[langCode]?.yearRange) {
        const r = languages[langCode].yearRange;
        return [r[0], r[1]];
    }

    if (etymologyText) {
        const t = etymologyText.toLowerCase();
        if (t.includes("old english")) return [700, 1100];
        if (t.includes("middle english")) return [1100, 1500];
        if (t.includes("modern english")) return [1500, 9999];
    }

    return [null, null];
}

// make sure all values are SQLite-safe
function safeValue(val: any): string | number | null {
    if (val === undefined || val === null) return null;
    if (typeof val === "string" || typeof val === "number") return val;
    if (typeof val === "bigint") return Number(val);
    return JSON.stringify(val);
}

const db = new Database(DB_FILE_PATH);

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

const insertWord = db.prepare(`
  INSERT INTO words (word, lang, pos, etymology, year_start, year_end)
  VALUES (?, ?, ?, ?, ?, ?)
`);

const insertTrans = db.prepare(`
  INSERT INTO translations (word_id, translation, lang, year_start, year_end)
  VALUES (?, ?, ?, ?, ?)
`);

const usedLangs = new Map<string, { words: number; translations: number }>();

const insertBatch = db.transaction((entries: any[]) => {
    let wordsInserted = 0;
    let translationsInserted = 0;
    let skippedEmpty = 0;

    for (const entry of entries) {
        const rawLang = safeValue(entry.lang?.trim().toLowerCase().replace(/\s+/g, "") || "english");
        let isoLang = langMap[rawLang as string] || "en";

        const etyLang = detectEtymologyLang(entry.etymology_text);
        if (etyLang) isoLang = etyLang;

        const [yearStart, yearEnd] = parseYears(entry.etymology_text, isoLang);

        if (!usedLangs.has(isoLang)) usedLangs.set(isoLang, { words: 0, translations: 0 });
        usedLangs.get(isoLang)!.words++;

        const info = insertWord.run(
            safeValue(entry.word),
            safeValue(isoLang),
            safeValue(entry.pos),
            safeValue(entry.etymology_text),
            safeValue(yearStart),
            safeValue(yearEnd)
        );
        const wordId = info.lastInsertRowid;
        wordsInserted++;

        (entry.translations || []).forEach((tr: any) => {
            const trLangRaw = safeValue(tr.lang_code?.trim().toLowerCase().replace(/\s+/g, "") || "??");
            const trLang = langMap[trLangRaw as string] || trLangRaw as string;
            const word = safeValue(tr.word);
            if (!word) { skippedEmpty++; return; }

            const [trStart, trEnd] = parseYears(tr.etymology_text, trLang);
            insertTrans.run(
                safeValue(wordId),
                word,
                safeValue(trLang),
                safeValue(trStart),
                safeValue(trEnd)
            );
            translationsInserted++;

            if (!usedLangs.has(trLang)) usedLangs.set(trLang, { words: 0, translations: 0 });
            usedLangs.get(trLang)!.translations++;
        });
    }

    return { wordsInserted, translationsInserted, skippedEmpty };
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
    }

    db.prepare(`VACUUM;`).run();
    db.prepare(`PRAGMA optimize;`).run();

    console.log("=== Import summary ===");
    console.log(`Total words inserted: ${totalWords}`);
    console.log(`Total translations inserted: ${totalTranslations}`);
    console.log(`Skipped empty translations: ${totalSkippedEmpty}`);
    console.log("\nLanguages used in this import:");
    Array.from(usedLangs).sort().forEach(([lang, counts]) => {
        console.log(`${lang}: ${counts.words} words, ${counts.translations} translations`);
    });

    // --- Additional counts from DB ---
    const wordCount = (db.prepare(`SELECT COUNT(*) AS cnt FROM words`).get() as { cnt: number }).cnt;
    const transCount = (db.prepare(`SELECT COUNT(*) AS cnt FROM translations`).get() as { cnt: number }).cnt;

    console.log("\n=== Verification counts from DB ===");
    console.log(`Words table count: ${wordCount}`);
    console.log(`Translations table count: ${transCount}`);
}

main().catch(err => {
    console.error("Fatal error:", err);
});
