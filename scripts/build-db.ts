import fs from "fs";
import readline from "readline";
import Database from "better-sqlite3";
import { DB_FILE_PATH } from "../src/config";
import { languages } from "../src/lib/langs";

const targetPOS: string[] = []; // ["noun", "verb"]

const langMap: Record<string, string> = {
    english: "en", german: "de", dutch: "nl", olddutch: "nl",
    swedish: "sv", norwegian: "nn", danish: "da", icelandic: "is",
    faroese: "fo", afrikaans: "af", yiddish: "yi",
    oldenglish: "ang", oldhighgerman: "ohg", oldnorse: "non",
    gothic: "got", lowgerman: "nds", frisian: "fry",
    northfrisian: "frr", eastfrisian: "frs", limburgish: "li",
    latin: "la", latelate: "lla", ancientgreek: "grc",
    moderngreek: "el", coptic: "cop", egyptian: "egy",
    proto: "pie", "proto-indo-european": "pie", "proto-germanic": "pgm",
    "proto-west-germanic": "pgw",
};

// Detects language from etymology text
function detectEtymologyLang(etymologyText?: string): string | null {
    if (!etymologyText) return null;
    const text = etymologyText.toLowerCase();
    for (const [key, code] of Object.entries(langMap)) {
        if (text.includes(key)) return code;
    }
    return null;
}

// Parse approximate year range
function parseYears(etymologyText?: string, langCode?: string): [number | null, number | null] {
    if (!etymologyText && !langCode) return [null, null];
    const match = etymologyText?.match(/c\.?\s*(\d{3,4})/);
    if (match) return [parseInt(match[1]), parseInt(match[1])];
    if (langCode && languages[langCode]?.yearRange) return [...languages[langCode].yearRange];
    if (etymologyText) {
        const t = etymologyText.toLowerCase();
        if (t.includes("old english")) return [700, 1100];
        if (t.includes("middle english")) return [1100, 1500];
        if (t.includes("modern english")) return [1500, 9999];
    }
    return [null, null];
}

function safeValue(val: any): string | number | null {
    if (val === undefined || val === null) return null;
    if (typeof val === "string" || typeof val === "number") return val;
    if (typeof val === "bigint") return Number(val);
    return JSON.stringify(val);
}

// Reset DB
if (fs.existsSync(DB_FILE_PATH)) fs.unlinkSync(DB_FILE_PATH);
const db = new Database(DB_FILE_PATH);

db.exec(`
CREATE TABLE words (
  id INTEGER PRIMARY KEY,
  word TEXT NOT NULL,
  lang TEXT NOT NULL,
  pos TEXT,
  etymology TEXT,
  year_start INTEGER,
  year_end INTEGER
);
CREATE TABLE translations (
  id INTEGER PRIMARY KEY,
  word_id INTEGER NOT NULL REFERENCES words(id),
  translation TEXT NOT NULL,
  lang TEXT NOT NULL,
  year_start INTEGER,
  year_end INTEGER
);
CREATE TABLE IF NOT EXISTS cognates (
  id INTEGER PRIMARY KEY,
  word_id INTEGER NOT NULL REFERENCES words(id),
  cognate TEXT NOT NULL,
  lang TEXT NOT NULL
);
`);

const insertWord = db.prepare(`INSERT INTO words (word, lang, pos, etymology, year_start, year_end) VALUES (?, ?, ?, ?, ?, ?)`);
const insertTrans = db.prepare(`INSERT INTO translations (word_id, translation, lang, year_start, year_end) VALUES (?, ?, ?, ?, ?)`);
const insertCognate = db.prepare(`INSERT INTO cognates (word_id, cognate, lang) VALUES (?, ?, ?)`);
const usedLangs = new Map<string, { words: number; translations: number }>();

const englishChain = new Set([
    'en', 'enm', 'ang', 'non', 'pgw', 'pgm',
    'fry', 'frs', 'frr', 'nds', 'ohg', 'nl', 'olddutch',
    'la', 'lla', 'vl', // Latin & Vulgar Latin
    'grc', 'el',       // Greek
    'fro', 'fr',       // French
    'pie',             // Proto-Indo-European
]);

const insertBatch = db.transaction((entries: any[]) => {
    let wordsInserted = 0;
    let translationsInserted = 0;
    let cognatesInserted = 0;
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

        // Extract cognates
        if (entry.etymology_text?.includes("Cognates")) {
            const cognateSection = entry.etymology_text.split("Cognates")[1];
            const matches = cognateSection.match(/([A-Za-z\u00C0-\u024F\u0370-\u03FF\u0400-\u04FF’'’-]+),?/g);
            if (matches) {
                matches.forEach((cog: string) => {
                    const cogTrim = cog.trim();
                    if (cogTrim) {
                        insertCognate.run(wordId, cogTrim, '??'); // Language unknown
                        cognatesInserted++;
                    }
                });
            }
        }

        // English etymology chain
        (entry.translations || []).forEach((tr: any) => {
            const trWord = safeValue(tr.word);
            if (!trWord) {
                skippedEmpty++;
                return;
            }

            const trLangRaw = safeValue(tr.lang_code?.trim().toLowerCase() || "??");
            const trLang = langMap[trLangRaw as string] || trLangRaw as string;

            if (!englishChain.has(trLang)) {
                skippedEmpty++;
                return;
            }

            insertTrans.run(
                wordId,
                trWord,
                safeValue(trLang),
                ...parseYears(tr.etymology_text, trLang)
            );

            translationsInserted++;
            if (!usedLangs.has(trLang)) usedLangs.set(trLang, { words: 0, translations: 0 });
            usedLangs.get(trLang)!.translations++;
        });

        if (wordsInserted % 1000 === 0) console.log(`Inserted ${wordsInserted} words so far...`);
        if (translationsInserted > 0 && translationsInserted % 5000 === 0) console.log(`Inserted ${translationsInserted} translations so far...`);
    }

    return { wordsInserted, translationsInserted, cognatesInserted, skippedEmpty };
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
    let linesProcessed = 0;

    for await (const line of rl) {
        linesProcessed++;
        if (linesProcessed % 1000 === 0) console.log(`Read ${linesProcessed} lines...`);

        try {
            const entry = JSON.parse(line);
            if (targetPOS.length && !targetPOS.includes(entry.pos)) continue;

            batch.push(entry);
            if (batch.length >= batchSize) {
                const res = insertBatch(batch);
                totalWords += res.wordsInserted;
                totalTranslations += res.translationsInserted;
                totalSkippedEmpty += res.skippedEmpty;
                console.log(`Batch inserted: ${res.wordsInserted} words, ${res.translationsInserted} translations, skipped ${res.skippedEmpty} unrelated`);
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
        console.log(`Final batch inserted: ${res.wordsInserted} words, ${res.translationsInserted} translations, skipped ${res.skippedEmpty} unrelated`);
    }

    db.prepare(`VACUUM;`).run();
    db.prepare(`PRAGMA optimize;`).run();

    console.log("=== Import summary ===");
    console.log(`Total words inserted: ${totalWords}`);
    console.log(`Total translations inserted: ${totalTranslations}`);
    console.log(`Skipped unrelated translations: ${totalSkippedEmpty}`);
    console.log("\nLanguages used in this import:");
    Array.from(usedLangs).sort().forEach(([lang, counts]) => {
        console.log(`${lang}: ${counts.words} words, ${counts.translations} translations`);
    });

    const wordCount = (db.prepare(`SELECT COUNT(*) AS cnt FROM words`).get() as { cnt: number }).cnt;
    const transCount = (db.prepare(`SELECT COUNT(*) AS cnt FROM translations`).get() as { cnt: number }).cnt;
    const cognateCount = (db.prepare(`SELECT COUNT(*) AS cnt FROM cognates`).get() as { cnt: number }).cnt;

    console.log("\n=== Verification counts from DB ===");
    console.log(`Words table count: ${wordCount}`);
    console.log(`Translations table count: ${transCount}`);
    console.log(`Cognates table count: ${cognateCount}`);
}

main().catch(err => console.error("Fatal error:", err));
