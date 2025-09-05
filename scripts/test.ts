// scripts/analyze-etymology-refined.ts
import fs from "fs";
import readline from "readline";

const PATH = "./data/kaikki.org-dictionary-English.jsonl";

type EtymCategory = "trivial" | "proto" | "language" | "other";

const trivialPatterns: RegExp[] = [
    /^\?\s*\+\s*-/i,            // ? + -ite
    /^shortening/i,
    /^derived/i,
    /^see/i,
    /^unknown/i,
    /^onomatopoeic/i,
    /^imitative/i,
    /^from the genus/i,
];

const protoLangPatterns = [
    "Proto-Indo-European",
    "Proto-Germanic",
    "Proto-Italic",
    "Proto-Slavic",
    "Proto-Celtic",
    "Proto-Norse",
    "Proto-Semitic",
    "Proto-Uralic",
];

const validLanguages = [
    "latin", "french", "german", "spanish", "italian", "english",
    "swedish", "norwegian", "danish", "icelandic", "faroese",
    "dutch", "afrikaans", "yiddish", "coptic", "egyptian",
    "japanese", "mandarin", "arabic", "russian", "polish",
    "sanskrit", "hindi", "hebrew", "romanian",
];

const fromXRe = /from ([A-Za-z-]+)/g;

async function main() {
    if (!fs.existsSync(PATH)) {
        console.error("File not found:", PATH);
        process.exit(1);
    }

    const rl = readline.createInterface({
        input: fs.createReadStream(PATH),
        crlfDelay: Infinity
    });

    const categoryCounts = new Map<EtymCategory, number>();
    const protoCounts = new Map<string, number>();
    const languageCounts = new Map<string, number>();
    const otherFromXCounts = new Map<string, number>();

    let lineNo = 0;

    for await (const line of rl) {
        lineNo++;
        const trimmed = line.trim();
        if (!trimmed) continue;

        let entry: any;
        try { entry = JSON.parse(trimmed); }
        catch { continue; }

        const etyText = entry.etymology_text || entry.etymology;
        if (!etyText) continue;

        const normText = etyText.trim().toLowerCase();

        // check trivial
        let isTrivial = trivialPatterns.some(p => p.test(normText));
        if (isTrivial) {
            categoryCounts.set("trivial", (categoryCounts.get("trivial") || 0) + 1);
            continue;
        }

        // check proto
        const protoMatch = protoLangPatterns.find(p => etyText.includes(p));
        if (protoMatch) {
            categoryCounts.set("proto", (categoryCounts.get("proto") || 0) + 1);
            protoCounts.set(protoMatch, (protoCounts.get(protoMatch) || 0) + 1);
            continue;
        }

        // check from X hints
        let hasLang = false;
        let match: RegExpExecArray | null;
        while ((match = fromXRe.exec(etyText))) {
            const x = match[1].toLowerCase();
            if (validLanguages.includes(x)) {
                hasLang = true;
                languageCounts.set(x, (languageCounts.get(x) || 0) + 1);
            } else {
                otherFromXCounts.set(x, (otherFromXCounts.get(x) || 0) + 1);
            }
        }

        if (hasLang) {
            categoryCounts.set("language", (categoryCounts.get("language") || 0) + 1);
        } else {
            categoryCounts.set("other", (categoryCounts.get("other") || 0) + 1);
        }
    }

    console.log("=== Etymology categories summary ===");
    Array.from(categoryCounts.entries()).sort((a, b) => b[1] - a[1])
        .forEach(([cat, count]) => console.log(`${cat}: ${count}`));

    console.log("\n=== Proto-languages detected ===");
    Array.from(protoCounts.entries()).sort((a, b) => b[1] - a[1])
        .forEach(([proto, count]) => console.log(`${proto}: ${count}`));

    console.log("\n=== Valid languages detected in 'from X' ===");
    Array.from(languageCounts.entries()).sort((a, b) => b[1] - a[1])
        .forEach(([lang, count]) => console.log(`${lang}: ${count}`));

    console.log("\n=== Other 'from X' variants (potential false positives) ===");
    Array.from(otherFromXCounts.entries()).sort((a, b) => b[1] - a[1])
        .slice(0, 50)
        .forEach(([x, count]) => console.log(`${x}: ${count}`));

    console.log("\nDone.\n");
}

main().catch(console.error);
