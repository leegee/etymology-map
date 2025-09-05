import Database from "better-sqlite3";
import fs from "fs";

const db = new Database("./data/words.db");

// threshold for translations
const MIN_TRANSLATION_COUNT = 200;

// get all word langs
const wordLangs: { lang: string; count: number }[] = db
    .prepare(`SELECT lang, COUNT(*) AS cnt FROM words GROUP BY lang`)
    .all()
    .map(r => ({ lang: r.lang, count: r.cnt }));

// get translation langs with > MIN_TRANSLATION_COUNT
const transLangs: { lang: string; count: number }[] = db
    .prepare(
        `SELECT lang, COUNT(*) AS cnt FROM translations GROUP BY lang HAVING COUNT(*) > ?`
    )
    .all(MIN_TRANSLATION_COUNT)
    .map(r => ({ lang: r.lang, count: r.cnt }));

const langsMap = new Map<string, number>();
wordLangs.forEach(l => langsMap.set(l.lang, l.count));
transLangs.forEach(l =>
    langsMap.set(l.lang, Math.max(langsMap.get(l.lang) || 0, l.count))
);

const sortedLangs = [...langsMap.entries()].sort((a, b) => b[1] - a[1]);

// const simpleOutput = sortedLangs.map(([code, count]) => ({ code, count }));
const simpleOutput = sortedLangs.map(([code]) => (code));

fs.writeFileSync("lang-codes.json", JSON.stringify(simpleOutput, null, 2));

console.log("Generated", simpleOutput.length, "language codes.");
