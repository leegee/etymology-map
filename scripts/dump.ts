import fs from "fs";
import path from "path";
import { db, stmtFindTranslations } from "~/db";
import { STATIC_BASE } from "~/lib/fetch";

const outDir = path.resolve("../public/" + STATIC_BASE);

function buildPathFromWord(baseDir: string, word: string) {
    const clean = word.replace(/[^a-z0-9]+/gi, "_").toLowerCase();
    const first = clean[0] ?? "_";
    const second = clean[1] ?? "_";

    const dir = path.join(baseDir, first, first + second);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const fileName = path.join(dir, clean + ".json");
    return fileName;
}

const allWords = db.prepare("SELECT * FROM words").all();

console.log(`Found ${allWords.length} words. Generating static JSON...`);

let counter = 0;

for (const word of allWords) {
    const translations = stmtFindTranslations.all(word.id);

    const result = {
        ...word,
        translations,
    };

    const fileName = buildPathFromWord(outDir, word.word);
    fs.writeFileSync(fileName, JSON.stringify(result, null, 2), "utf-8");

    counter++;
    if (counter % 500 === 0) console.log(`Generated ${counter} / ${allWords.length} files...`);
}

console.log(`Done! Generated ${counter} static JSON files under ${outDir}`);
