// scripts/analyze-kaikki.ts
import fs from "fs";
import readline from "readline";

type AnyObj = Record<string, any>;

const PATH = "./data/kaikki.org-dictionary-English.jsonl";
const SAMPLE_LIMIT = 20; // how many example entries to print where translations have etymology/date-like text

async function main() {
    if (!fs.existsSync(PATH)) {
        console.error("File not found:", PATH);
        process.exit(1);
    }

    const rl = readline.createInterface({
        input: fs.createReadStream(PATH),
        crlfDelay: Infinity,
    });

    let lineNo = 0;
    let totalEntries = 0;
    let entriesWithEtym = 0;
    let entriesWithTranslations = 0;
    let totalTranslations = 0;

    const transPerEntry = new Map<number, number>();
    const transLangCounts = new Map<string, number>();
    const transFieldCounts = new Map<string, number>();
    const allLanguages = new Set<string>();
    const etymLanguages = new Set<string>();

    let translationsWithEtymField = 0;
    let translationsWithDateLikeText = 0;

    const samples: { line: number; word?: string; pos?: string; translations: AnyObj[] }[] = [];

    // regex to detect date-like or etymology markers (c. 1200, Old English, Middle English, Proto-, Late Latin...)
    const dateLikeRe = /\b(c\.?\s*\d{3,4}|\d{3,4}|Old English|Middle English|Modern English|Proto-|Late Latin|c\.)\b/i;

    // regex to extract named languages from etymology text
    const langMentionRe = /\b(Old English|Middle English|Modern English|Proto-Indo-European|Proto-Germanic|Proto-Italic|Latin|Late Latin|Gothic|Old High German|Old Norse|Afro-Asiatic|Ancient Greek|Coptic|Egyptian)\b/gi;

    for await (const line of rl) {
        lineNo++;
        const trimmed = line.trim();
        if (!trimmed) continue;

        let entry: AnyObj;
        try {
            entry = JSON.parse(trimmed);
        } catch (err) {
            console.error("JSON parse error at line", lineNo, err);
            continue;
        }

        totalEntries++;
        if (entry.etymology_text || entry.etymology) entriesWithEtym++;

        // collect language from entry itself
        if (entry.lang) allLanguages.add(entry.lang.toString().trim());

        const translations: AnyObj[] = Array.isArray(entry.translations) ? entry.translations : [];
        if (translations.length) entriesWithTranslations++;
        totalTranslations += translations.length;
        transPerEntry.set(translations.length, (transPerEntry.get(translations.length) || 0) + 1);

        // extract language mentions from etymology text
        if (entry.etymology_text) {
            let match: RegExpExecArray | null;
            while ((match = langMentionRe.exec(entry.etymology_text))) {
                const lang = match[1];
                allLanguages.add(lang); // include in main set
                etymLanguages.add(lang); // track as "mentioned in etymology"
            }
        }

        for (const tr of translations) {
            // track language codes (try common keys)
            const langCode = (tr.lang_code || tr.code || tr.lang || "??").toString().toLowerCase();
            transLangCounts.set(langCode, (transLangCounts.get(langCode) || 0) + 1);
            allLanguages.add(langCode);

            // track which fields appear on translation objects
            if (tr && typeof tr === "object") {
                for (const k of Object.keys(tr)) {
                    const v = tr[k];
                    if (v !== null && v !== undefined && v !== "") {
                        transFieldCounts.set(k, (transFieldCounts.get(k) || 0) + 1);
                    }
                }
            }

            // detect translations that have an explicit etymology-like field
            if (tr.etymology || tr.etymology_text || tr.notes || tr.comment) {
                translationsWithEtymField++;
                if (samples.length < SAMPLE_LIMIT) {
                    samples.push({ line: lineNo, word: entry.word, pos: entry.pos, translations: [tr] });
                }
                continue;
            }

            // or detect date-like hints in any string field of the translation
            let foundDateLike = false;
            for (const v of Object.values(tr)) {
                if (typeof v === "string" && dateLikeRe.test(v)) {
                    translationsWithDateLikeText++;
                    foundDateLike = true;
                    if (samples.length < SAMPLE_LIMIT) {
                        samples.push({ line: lineNo, word: entry.word, pos: entry.pos, translations: [tr] });
                    }
                    break;
                }
            }
            if (foundDateLike) continue;
        }
    }

    // print summary
    console.log("\n=== Kaikki JSONL analysis summary ===\n");
    console.log("Total entries scanned:", totalEntries);
    console.log("Entries with etymology_text/etymology:", entriesWithEtym);
    console.log("Entries with at least one translation:", entriesWithTranslations);
    console.log("Total translation objects:", totalTranslations);
    console.log("");
    console.log("Translations with explicit etymology-like fields (etymology/etymology_text/notes/comment):", translationsWithEtymField);
    console.log("Translations with date-like text in any string field:", translationsWithDateLikeText);
    console.log("");

    // distribution of translations-per-entry (small sample output)
    const transDist = Array.from(transPerEntry.entries()).sort((a, b) => a[0] - b[0]);
    console.log("Translation-count distribution (translationsPerEntry -> number of entries) — top 30 rows:");
    transDist.slice(0, 30).forEach(([translations, count]) => {
        console.log(`${translations} -> ${count}`);
    });

    // top target language codes on translations
    console.log("\nTop 20 target language codes in translations:");
    Array.from(transLangCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20)
        .forEach(([lang, c]) => console.log(`${lang}: ${c}`));

    // translation object field frequency
    console.log("\nTop translation-object fields (field -> occurrences):");
    Array.from(transFieldCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 30)
        .forEach(([f, c]) => console.log(`${f}: ${c}`));

    // print all languages found
    console.log("\nAll languages found in entries, translations, or etymology text:");
    Array.from(allLanguages).sort().forEach((l) => console.log(l));

    // check for languages mentioned in etymology but not as any code
    const codesOnlySet = new Set(
        Array.from(allLanguages)
            .filter((l) => /^[a-z]{2,3}$/.test(l.toLowerCase()))
    );
    const etymOnly = Array.from(etymLanguages).filter((l) => !codesOnlySet.has(l.toLowerCase()));
    console.log("\nLanguages mentioned in etymology text but never used as a code in entries/translations:");
    etymOnly.forEach((l) => console.log(l));

    console.log("\nDone.\n");
}

main().catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
});
