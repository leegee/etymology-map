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
    "proto-indo-european": "pie",
    "proto-germanic": "pgm",
};

// --- Proto-language & noise detection ---
const protoRe = /\b(proto[- ]\w+)\b/i;
const fromXRe = /from\s+([a-zA-Z-]+)/i;

const sourceLangWhitelist = new Set([
    "latin", "greek", "sanskrit", "maori", "arabic", "hebrew", "armenian",
    "tamil", "persian", "korean", "chinese", "japanese", "hindi", "egyptian"
]);

const trivialPatterns: RegExp[] = [
    /^\?\s*\+\s*-/i,
    /^shortening/i,
    /^derived/i,
    /^see/i,
    /^unknown/i,
    /^onomatopoeic/i,
    /^imitative/i,
    /^from the genus/i
];

const protoBlacklist: RegExp[] = [
    /Root/i,
    /^Proto$/i,
    /Elements/i,
    /Phrase/i,
    /Base/i,
    /Origin/i,
    /Word Used To Mean/i
];

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

    if (langCode && languages[langCode]?.yearRange) return languages[langCode].yearRange;

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

// --- Database setup ---
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
CREATE TABLE IF NOT EXISTS word_links (
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
  INSERT INTO word_links (word_id, translation, lang, year_start, year_end)
  VALUES (?, ?, ?, ?, ?)
`);

const usedLangs = new Map<string, { words: number; wordLinks: number }>();

// --- Main batch insert with filtering ---
const insertBatch = db.transaction((entries: any[]) => {
    let wordsInserted = 0;
    let wordLinksInserted = 0;
    let skippedEmpty = 0;

    for (const entry of entries) {
        const etym = (entry.etymology_text || entry.etymology || "").toString().trim();
        if (!etym || trivialPatterns.some(p => p.test(etym))) continue;

        // --- Proto-language detection ---
        let protoLang: string | null = null;
        const protoMatch = etym.match(protoRe);
        if (protoMatch) {
            protoLang = protoMatch[1].replace(/[- ]/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());
            if (protoBlacklist.some(p => p.test(protoLang!))) protoLang = null;
        }

        // --- "From X" detection ---
        let srcLang: string | null = null;
        const fromMatch = etym.match(fromXRe);
        if (fromMatch) {
            const candidate = fromMatch[1].toLowerCase();
            if (sourceLangWhitelist.has(candidate)) srcLang = candidate;
        }

        // Determine final ISO language
        const rawLang = safeValue(entry.lang?.trim().toLowerCase().replace(/\s+/g, "") || "english");
        let isoLang = langMap[rawLang as string] || "en";
        const etyLang = detectEtymologyLang(etym);
        if (etyLang) isoLang = etyLang;
        if (protoLang) isoLang = protoLang.toLowerCase(); // proto takes precedence
        if (srcLang) isoLang = srcLang;

        const [yearStart, yearEnd] = parseYears(etym, isoLang);

        if (!usedLangs.has(isoLang)) usedLangs.set(isoLang, { words: 0, wordLinks: 0 });
        usedLangs.get(isoLang)!.words++;

        const info = insertWord.run(
            safeValue(entry.word),
            safeValue(isoLang),
            safeValue(entry.pos),
            safeValue(etym),
            safeValue(yearStart),
            safeValue(yearEnd)
        );
        const wordId = info.lastInsertRowid;
        wordsInserted++;

        (entry.wordLinks || []).forEach((tr: any) => {
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
            wordLinksInserted++;
            if (!usedLangs.has(trLang)) usedLangs.set(trLang, { words: 0, wordLinks: 0 });
            usedLangs.get(trLang)!.wordLinks++;
        });
    }

    return { wordsInserted, wordLinksInserted, skippedEmpty };
});

async function main() {
    const rl = readline.createInterface({
        input: fs.createReadStream("./data/kaikki.org-dictionary-English.jsonl"),
        crlfDelay: Infinity
    });

    const batchSize = 1000;
    let batch: any[] = [];
    let totalWords = 0;
    let totalwordLinks = 0;
    let totalSkippedEmpty = 0;

    for await (const line of rl) {
        try {
            const entry = JSON.parse(line);
            if (targetPOS.length && !targetPOS.includes(entry.pos)) continue;

            batch.push(entry);
            if (batch.length >= batchSize) {
                const res = insertBatch(batch);
                totalWords += res.wordsInserted;
                totalwordLinks += res.wordLinksInserted;
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
        totalwordLinks += res.wordLinksInserted;
        totalSkippedEmpty += res.skippedEmpty;
    }

    db.prepare(`VACUUM;`).run();
    db.prepare(`PRAGMA optimize;`).run();

    console.log("=== Import summary ===");
    console.log(`Total words inserted: ${totalWords}`);
    console.log(`Total word_links inserted: ${totalwordLinks}`);
    console.log(`Skipped empty word_links: ${totalSkippedEmpty}`);
    console.log("\nLanguages used in this import:");
    Array.from(usedLangs).sort().forEach(([lang, counts]) => {
        console.log(`${lang}: ${counts.words} words, ${counts.wordLinks} word_links`);
    });

    const wordCount = (db.prepare(`SELECT COUNT(*) AS cnt FROM words`).get() as { cnt: number }).cnt;
    const transCount = (db.prepare(`SELECT COUNT(*) AS cnt FROM wordLinks`).get() as { cnt: number }).cnt;
    console.log("\n=== Verification counts from DB ===");
    console.log(`Words table count: ${wordCount}`);
    console.log(`wordLinks table count: ${transCount}`);
}

main().catch(err => console.error("Fatal error:", err));
