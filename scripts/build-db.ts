import fs from "fs";
import path from "path";
import readline from "readline";
import Database, { Statement, RunResult } from "better-sqlite3";
import { DB_FILE_PATH, OFFLINE_DB_PATH } from "./config";
import { languages } from "../src/lib/langs";

const google10000path = path.resolve("./data/google-10000-english.txt");

if (fs.existsSync(DB_FILE_PATH)) fs.unlinkSync(DB_FILE_PATH);
const db = new Database(DB_FILE_PATH);

if (!fs.existsSync(OFFLINE_DB_PATH)) throw new Error('No offlined DB?');
const offlineDb = new Database(OFFLINE_DB_PATH, { readonly: true });

// Entry from Kaikki.org JSONL
export type KaikkiEntry = {
    word: string;
    lang?: string;
    pos?: string;
    etymology_text?: string;
};

// Entry from etymwn_offline.db
export type EtymwnEntry = {
    word: string;
    lang?: string;
    pos?: string;
    etymology?: string;
    cognates?: string[];
};

export type WordEntry = KaikkiEntry | EtymwnEntry;

export type Stage = { word: string; lang: string };

export type InsertBatchResult = {
    wordsInserted: number;
    wordLinksInserted: number;
    cognatesInserted: number;
};

const allowedWords = new Set(
    fs
        .readFileSync(google10000path, "utf-8")
        .split(/\r?\n/)
        .map((w) => w.trim().toLowerCase())
        .filter(Boolean)
);

// restrict by part of speech
const targetPOS: string[] = []; // e.g. ["noun", "verb"]

function safeValue(val: unknown): string | null {
    if (val === undefined || val === null) return null;
    if (typeof val === "string") return val;
    if (typeof val === "number") return val.toString();
    return JSON.stringify(val);
}

function parseEtymology(etymologyText?: string): Stage[] {
    const stages: Stage[] = [];
    if (!etymologyText) return stages;

    const parenMatches: string[] = [];
    const text = etymologyText.replace(/\(([^)]+)\)/g, (_, p1) => {
        parenMatches.push(p1);
        return "";
    });

    const tokens = text
        .split(/[,.;\n]/)
        .map((s) => s.trim())
        .filter(Boolean);

    const allTokens = [...tokens, ...parenMatches]
        .map((t) => t.trim())
        .filter((t) => t && !/^[;,.]+$/.test(t));

    allTokens.forEach((token) => {
        const match = token.match(
            /(?:from\s+)?([A-Za-z\- ]+?)\s+([^\s][A-Za-z0-9’'’\-]+)/i
        );
        if (match) {
            const [, langNameRaw, wordRaw] = match;
            const langName = langNameRaw.trim().toLowerCase();
            const word = wordRaw.trim().replace(/\.$/, "");
            const langCode =
                Object.keys(languages).find(
                    (code) =>
                        languages[code].englishName.toLowerCase() === langName
                ) || "en";
            if (word) stages.push({ word, lang: langCode });
        } else {
            const word = token.trim();
            if (word) stages.push({ word, lang: "en" });
        }
    });

    return stages;
}

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
  lang TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS cognates (
  id INTEGER PRIMARY KEY,
  word_id INTEGER NOT NULL REFERENCES words(id),
  cognate TEXT NOT NULL,
  lang TEXT NOT NULL
);
`);

const insertWord: Statement = db.prepare(
    `INSERT INTO words (word, lang, pos, etymology) VALUES (?, ?, ?, ?)`
);
const insertLinkedWord: Statement = db.prepare(
    `INSERT INTO word_links (word_id, linked_word, lang) VALUES (?, ?, ?)`
);
const insertCognate: Statement = db.prepare(
    `INSERT INTO cognates (word_id, cognate, lang) VALUES (?, ?, ?)`
);

const usedLangs = new Map<string, { words: number; wordLinks: number }>();

const insertBatch = db.transaction((entries: KaikkiEntry[]): InsertBatchResult => {
    let wordsInserted = 0;
    let wordLinksInserted = 0;
    let cognatesInserted = 0;

    for (const entry of entries) {
        const wordLower = (entry.word || "").toLowerCase();
        if (!allowedWords.has(wordLower)) continue;

        // subject language
        const rawLang = safeValue(
            entry.lang?.trim().toLowerCase().replace(/\s+/g, "") || "english"
        );
        const isoLang =
            Object.keys(languages).find(
                (code) => languages[code].englishName.toLowerCase() === rawLang
            ) || "en";

        // track used langs
        if (!usedLangs.has(isoLang))
            usedLangs.set(isoLang, { words: 0, wordLinks: 0 });
        usedLangs.get(isoLang)!.words++;

        // insert subject word
        const info: RunResult = insertWord.run(
            safeValue(entry.word),
            isoLang,
            safeValue(entry.pos),
            safeValue(entry.etymology_text)
        );
        const wordId = Number(info.lastInsertRowid);
        wordsInserted++;

        // cognates
        if (entry.etymology_text?.includes("Cognates")) {
            const cognateSection = entry.etymology_text.split("Cognates")[1];
            const matches = cognateSection.match(
                /([A-Za-z\u00C0-\u024F\u0370-\u03FF\u0400-\u04FF’'’-]+),?/g
            );
            if (matches) {
                matches.forEach((cog: string) => {
                    const cogTrim = cog.trim();
                    if (cogTrim) {
                        insertCognate.run(wordId, cogTrim, "??");
                        cognatesInserted++;
                    }
                });
            }
        }

        // parse etymology
        const stages = parseEtymology(entry.etymology_text);
        const subjectLangs = new Set([isoLang]);

        stages.forEach((stage) => {
            if (subjectLangs.has(stage.lang)) return;

            insertLinkedWord.run(wordId, stage.word, stage.lang);
            wordLinksInserted++;

            if (!usedLangs.has(stage.lang))
                usedLangs.set(stage.lang, { words: 0, wordLinks: 0 });
            usedLangs.get(stage.lang)!.wordLinks++;
        });
    }

    return { wordsInserted, wordLinksInserted, cognatesInserted };
});

async function main(): Promise<void> {
    const jsonlReadline = readline.createInterface({
        input: fs.createReadStream("./data/kaikki.org-dictionary-English.jsonl"),
        crlfDelay: Infinity,
    });

    const batchSize = 1000;
    let batch: KaikkiEntry[] = [];
    let totalWords = 0;
    let totalWordLinks = 0;
    let linesProcessed = 0;

    for await (const line of jsonlReadline) {
        linesProcessed++;
        if (linesProcessed % 10000 === 0)
            console.log(`Read ${linesProcessed} lines...`);

        try {
            const entry = JSON.parse(line) as KaikkiEntry;
            if (targetPOS.length && entry.pos && !targetPOS.includes(entry.pos))
                continue;

            batch.push(entry);
            if (batch.length >= batchSize) {
                const res = insertBatch(batch);
                totalWords += res.wordsInserted;
                totalWordLinks += res.wordLinksInserted;
                console.log(
                    `Batch inserted: ${res.wordsInserted} words, ${res.wordLinksInserted} wordLinks`
                );
                batch = [];
            }
        } catch (err) {
            console.error("Failed to parse line:", err);
        }
    }

    console.log("Augmenting DB from etymwn_offline.db...");
    const stmt = offlineDb.prepare("SELECT * FROM words");

    for (const entry of stmt.iterate() as Iterable<EtymwnEntry>) {
        const wordLower = (entry.word || "").toLowerCase();
        let wordId: number | null = null;

        if (allowedWords.has(wordLower)) {
            const rawLang = (entry.lang || "english")
                .trim()
                .toLowerCase()
                .replace(/\s+/g, "");
            const isoLang =
                Object.keys(languages).find(
                    (c) => languages[c].englishName.toLowerCase() === rawLang
                ) || "en";

            const info = insertWord.run(
                entry.word,
                isoLang,
                entry.pos,
                entry.etymology
            );
            wordId = Number(info.lastInsertRowid);
        }

        const stages = parseEtymology(entry.etymology);
        if (wordId !== null) {
            stages.forEach((stage) => {
                insertLinkedWord.run(wordId!, stage.word, stage.lang);
            });
        }

        if (entry.cognates?.length) {
            entry.cognates.forEach((cog) => {
                if (wordId !== null) insertCognate.run(wordId, cog, "??");
            });
        }
    }


    // leftover batch
    if (batch.length > 0) {
        const res = insertBatch(batch);
        totalWords += res.wordsInserted;
        totalWordLinks += res.wordLinksInserted;
        console.log(
            `Final batch inserted: ${res.wordsInserted} words, ${res.wordLinksInserted} wordLinks`
        );
    }

    db.prepare(`VACUUM;`).run();
    db.prepare(`PRAGMA optimize;`).run();

    console.log("# Import summary");
    console.log(`Total words inserted: ${totalWords}`);
    console.log(`Total word_links inserted: ${totalWordLinks}`);
    console.log("\nLanguages used in this import:");
    Array.from(usedLangs)
        .sort()
        .forEach(([lang, counts]) => {
            console.log(`${lang}: ${counts.words} words, ${counts.wordLinks} word_links`);
        });

    const wordCount = (
        db.prepare(`SELECT COUNT(*) AS cnt FROM words`).get() as { cnt: number }
    ).cnt;
    const transCount = (
        db.prepare(`SELECT COUNT(*) AS cnt FROM word_links`).get() as { cnt: number }
    ).cnt;
    const cognateCount = (
        db.prepare(`SELECT COUNT(*) AS cnt FROM cognates`).get() as { cnt: number }
    ).cnt;

    console.log("\n=== Verification counts from DB ===");
    console.log(`Words table count: ${wordCount}`);
    console.log(`word_links table count: ${transCount}`);
    console.log(`Cognates table count: ${cognateCount}`);
}

main().catch((err) => console.error("Fatal error:", err));
