import fs from "node:fs";
import path from "node:path";
import { db, stmtFindTranslations, stmtFindExact } from "~/db";
import { dirForhWord, pathForhWord, STATIC_BASE } from "~/lib/fetch";

const inputFile = path.resolve("./data/google-10000-english.txt");
const outDir = path.resolve("./public/" + STATIC_BASE);

console.log("Input:", inputFile);
console.log("Out dir:", STATIC_BASE, "=", outDir);

if (!fs.existsSync(outDir)) throw new Error("Missing dir " + outDir);
if (!fs.existsSync(inputFile)) throw new Error("Missing inputFile " + inputFile);

function buildPathFromWord(baseDir: string, word: string) {
    const dir = path.join(baseDir, dirForhWord(word));
    const wordPath = path.join(baseDir, pathForhWord(word));
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    return wordPath;
}

// Read and clean the word list
const words = fs
    .readFileSync(inputFile, "utf-8")
    .split(/[\n\r\f]+/)
    .map((w) => w.trim())
    .filter(Boolean);

let counter = 0;

for (const wordText of words) {
    const wordRow = stmtFindExact.get(wordText);

    if (!wordRow) {
        // Skip words not in the DB
        console.log('No entry in our DB for', wordText);
        continue;
    }

    const translations = stmtFindTranslations.all(wordRow.id);

    const result = { subject: [wordRow], translations };

    const fileName = buildPathFromWord(outDir, wordRow.word);
    fs.writeFileSync(fileName, JSON.stringify(result), "utf-8");

    counter++;
    if (counter % 500 === 0) console.log(`Generated ${counter} files...`);
}

console.log(`Done! Generated ${counter} static JSON files under ${outDir}`);
