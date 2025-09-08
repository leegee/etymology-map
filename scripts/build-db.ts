import fs from "fs";
import path from "path";
import readline from "readline";
import Database from "better-sqlite3";
import { DB_FILE_PATH } from "../src/config";
import { languages } from "../src/lib/langs";

// Load allowed words
const inputFile = path.resolve("./data/google-10000-english.txt");
const allowedWords = new Set(
    fs.readFileSync(inputFile, "utf-8")
        .split(/\r?\n/)
        .map(w => w.trim().toLowerCase())
        .filter(Boolean)
);

const targetPOS: string[] = []; // ["noun", "verb"]

function safeValue(val: any): string | null {
    if (val === undefined || val === null) return null;
    if (typeof val === "string") return val;
    if (typeof val === "number") return val.toString();
    return JSON.stringify(val);
}

function parseEtymology(etymologyText: string) {
    type Stage = { word: string; lang: string };
    const stages: Stage[] = [];
    if (!etymologyText) return stages;

    const parenMatches: string[] = [];
    const text = etymologyText.replace(/\(([^)]+)\)/g, (_, p1) => {
        parenMatches.push(p1);
        return "";
    });

    const tokens = text
        .split(/[,.;\n]/)
        .map(s => s.trim())
        .filter(Boolean);

    const allTokens = [...tokens, ...parenMatches];

    allTokens.forEach(token => {
        const match = token.match(/(?:from\s+)?([A-Za-z\- ]+?)\s+([^\s][A-Za-z0-9’'’\-]+)/i);
        if (match) {
            const [, langNameRaw, wordRaw] = match;
            const langName = langNameRaw.trim().toLowerCase();
            const word = wordRaw.trim().replace(/\.$/, "");
            const langCode = Object.keys(languages).find(
                code => languages[code].englishName.toLowerCase() === langName
            );
            if (langCode && word) stages.push({ word, lang: langCode });
        } else {
            const word = token.trim();
            if (word) stages.push({ word, lang: "en" });
        }
    });

    return stages;
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
  etymology TEXT
);
CREATE TABLE translations (
  id INTEGER PRIMARY KEY,
  word_id INTEGER NOT NULL REFERENCES words(id),
  translation TEXT NOT NULL,
  lang TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS cognates (
  id INTEGER PRIMARY KEY,
  word_id INTEGER NOT NULL REFERENCES words(id),
  cognate TEXT NOT NULL,
  lang TEXT NOT NULL
);
`);

const insertWord = db.prepare(
    `INSERT INTO words (word, lang, pos, etymology) VALUES (?, ?, ?, ?)`
);
const insertTrans = db.prepare(
    `INSERT INTO translations (word_id, translation, lang) VALUES (?, ?, ?)`
);
const insertCognate = db.prepare(
    `INSERT INTO cognates (word_id, cognate, lang) VALUES (?, ?, ?)`
);
const usedLangs = new Map<string, { words: number; translations: number }>();

const insertBatch = db.transaction((entries: any[]) => {
    let wordsInserted = 0;
    let translationsInserted = 0;
    let cognatesInserted = 0;

    for (const entry of entries) {
        const wordLower = (entry.word || "").toLowerCase();
        if (!allowedWords.has(wordLower)) continue; // skip if not in subject words

        const rawLang = safeValue(entry.lang?.trim().toLowerCase().replace(/\s+/g, "") || "english");
        const isoLang = Object.keys(languages).find(
            code => languages[code].englishName.toLowerCase() === rawLang
        ) || "en";

        if (!usedLangs.has(isoLang)) usedLangs.set(isoLang, { words: 0, translations: 0 });
        usedLangs.get(isoLang)!.words++;

        const info = insertWord.run(
            safeValue(entry.word),
            isoLang,
            safeValue(entry.pos),
            safeValue(entry.etymology_text)
        );
        const wordId = info.lastInsertRowid;
        wordsInserted++;

        if (entry.etymology_text?.includes("Cognates")) {
            const cognateSection = entry.etymology_text.split("Cognates")[1];
            const matches = cognateSection.match(/([A-Za-z\u00C0-\u024F\u0370-\u03FF\u0400-\u04FF’'’-]+),?/g);
            if (matches) {
                matches.forEach((cog: string) => {
                    const cogTrim = cog.trim();
                    if (cogTrim) {
                        insertCognate.run(wordId, cogTrim, '??');
                        cognatesInserted++;
                    }
                });
            }
        }

        const stages = parseEtymology(entry.etymology_text);
        stages.forEach(stage => {
            insertTrans.run(wordId, stage.word, stage.lang);
            translationsInserted++;
            if (!usedLangs.has(stage.lang)) usedLangs.set(stage.lang, { words: 0, translations: 0 });
            usedLangs.get(stage.lang)!.translations++;
        });
    }

    return { wordsInserted, translationsInserted, cognatesInserted };
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
                console.log(`Batch inserted: ${res.wordsInserted} words, ${res.translationsInserted} translations`);
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
        console.log(`Final batch inserted: ${res.wordsInserted} words, ${res.translationsInserted} translations`);
    }

    db.prepare(`VACUUM;`).run();
    db.prepare(`PRAGMA optimize;`).run();

    console.log("# Import summary");
    console.log(`Total words inserted: ${totalWords}`);
    console.log(`Total translations inserted: ${totalTranslations}`);
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
