// scripts/refined-analysis.ts
import fs from "fs";
import readline from "readline";

type AnyObj = Record<string, any>;

const PATH = "./data/kaikki.org-dictionary-English.jsonl";
const SAMPLE_LIMIT = 20;

const protoRe = /\b(proto[- ]\w+)\b/i;
const fromXRe = /from\s+([a-zA-Z-]+)/i;

// whitelist for valid source languages in `from X` phrases
const sourceLangWhitelist = new Set([
    "latin", "greek", "sanskrit", "maori", "arabic", "hebrew", "armenian", "tamil",
    "persian", "korean", "chinese", "japanese", "hindi", "egyptian"
]);

// trivial patterns to skip
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

// blacklist for pseudo/procedural proto-language strings
const protoBlacklist: RegExp[] = [
    /Root/i,
    /Elements/i,
    /Phrase/i,
    /Base/i,
    /Origin/i,
    /Word Used To Mean/i
];

async function main() {
    if (!fs.existsSync(PATH)) {
        console.error("File not found:", PATH);
        process.exit(1);
    }

    const rl = readline.createInterface({
        input: fs.createReadStream(PATH),
        crlfDelay: Infinity,
    });

    const validLangs = new Map<string, number>();
    const protoLangs = new Map<string, number>();
    const noise = new Map<string, number>();
    const samples: { line: number; word?: string; etym?: string }[] = [];

    let lineNo = 0;

    for await (const line of rl) {
        lineNo++;
        if (!line.trim()) continue;

        let entry: AnyObj;
        try {
            entry = JSON.parse(line);
        } catch {
            continue;
        }

        const etym = (entry.etymology_text || entry.etymology || "").toString().trim();
        if (!etym) continue;

        // skip trivial patterns
        if (trivialPatterns.some(pat => pat.test(etym))) {
            noise.set(etym, (noise.get(etym) || 0) + 1);
            continue;
        }

        // detect proto-languages
        const protoMatch = etym.match(protoRe);
        if (protoMatch) {
            const proto = protoMatch[1].replace(/[- ]/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());

            // skip if it matches blacklist
            if (protoBlacklist.some(pat => pat.test(proto))) {
                noise.set(proto, (noise.get(proto) || 0) + 1);
                continue;
            }

            protoLangs.set(proto, (protoLangs.get(proto) || 0) + 1);
            if (samples.length < SAMPLE_LIMIT) samples.push({ line: lineNo, word: entry.word, etym });
            continue;
        }

        // detect "from X" source language
        const fromMatch = etym.match(fromXRe);
        if (fromMatch) {
            const src = fromMatch[1].toLowerCase();
            if (sourceLangWhitelist.has(src)) {
                validLangs.set(src, (validLangs.get(src) || 0) + 1);
                if (samples.length < SAMPLE_LIMIT) samples.push({ line: lineNo, word: entry.word, etym });
                continue;
            } else {
                noise.set(src, (noise.get(src) || 0) + 1);
                continue;
            }
        }

        // fallback to Noise
        noise.set(etym, (noise.get(etym) || 0) + 1);
    }

    function printCategory(title: string, map: Map<string, number>) {
        console.log(`\n=== ${title} ===`);
        Array.from(map.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 50)
            .forEach(([k, v]) => console.log(`${k.padEnd(25)} ${v}`));
    }

    printCategory("Valid languages", validLangs);
    printCategory("Proto-languages", protoLangs);
    printCategory("Noise / other", noise);

    console.log("\n=== Sample entries ===");
    samples.forEach(s => console.log(`Line ${s.line}: ${s.word} -> ${s.etym}`));

    console.log("\nTotal entries scanned:", lineNo);
    console.log("Done.");
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
