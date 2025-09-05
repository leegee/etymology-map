// scripts/refined-analysis.ts
import fs from "fs";
import readline from "readline";

type AnyObj = Record<string, any>;

const PATH = "./data/kaikki.org-dictionary-English.jsonl";
const SAMPLE_LIMIT = 20;

// ISO codes → normalized language names
const validLangMap: Record<string, string> = {
    fi: "Finnish",
    ru: "Russian",
    de: "German",
    es: "Spanish",
    fr: "French",
    it: "Italian",
    pl: "Polish",
    nl: "Dutch",
    ar: "Arabic",
    ja: "Japanese",
    zh: "Mandarin",
    hi: "Hindi",
    he: "Hebrew",
    sv: "Swedish",
    nn: "Norwegian",
    da: "Danish",
    is: "Icelandic",
    af: "Afrikaans",
    yi: "Yiddish",
    en: "English",
    sq: "Albanian",
    eo: "Esperanto",
    la: "Latin",
    grc: "Ancient Greek",
    cop: "Coptic",
    egyptian: "Egyptian",
    // add more as needed
};

// proto-language normalization map
const protoMap: Record<string, string> = {
    "proto-indo-european": "Proto-Indo-European",
    "proto-germanic": "Proto-Germanic",
    "proto-west": "Proto-West Germanic",
    "proto-itic": "Proto-Italic",
    "proto-slavic": "Proto-Slavic",
    "proto-celtic": "Proto-Celtic",
    "proto-semitic": "Proto-Semitic",
    "proto-uralic": "Proto-Uralic",
    "proto-norse": "Proto-Norse",
    // add more as needed
};

// trivial/noise patterns
const trivialPatterns: RegExp[] = [
    /^\?\s*\+\s*-/i,
    /^shortening/i,
    /^derived/i,
    /^see/i,
    /^unknown/i,
    /^onomatopoeic/i,
    /^imitative/i,
    /^from the genus/i,
];

const fromXRe = /^from\s+(.+)$/i;

async function main() {
    if (!fs.existsSync(PATH)) {
        console.error("File not found:", PATH);
        process.exit(1);
    }

    const rl = readline.createInterface({
        input: fs.createReadStream(PATH),
        crlfDelay: Infinity,
    });

    const countsValid: Record<string, number> = {};
    const countsProto: Record<string, number> = {};
    const countsNoise: Record<string, number> = {};

    const samples: { line: number; word: string; etym: string }[] = [];

    let lineNo = 0;

    for await (const line of rl) {
        lineNo++;
        const trimmed = line.trim();
        if (!trimmed) continue;

        let entry: AnyObj;
        try {
            entry = JSON.parse(trimmed);
        } catch {
            continue;
        }

        const etym = (entry.etymology_text || entry.etymology || "").trim();
        if (!etym) continue;

        let matched = false;

        // trivial / noise check
        for (const pat of trivialPatterns) {
            if (pat.test(etym)) {
                countsNoise[pat.source] = (countsNoise[pat.source] || 0) + 1;
                matched = true;
                break;
            }
        }
        if (matched) continue;

        // 'from X' detection
        const fromMatch = etym.match(fromXRe);
        if (fromMatch) {
            let langRaw = fromMatch[1].toLowerCase().trim();
            // normalize proto
            if (protoMap[langRaw]) {
                countsProto[protoMap[langRaw]] = (countsProto[protoMap[langRaw]] || 0) + 1;
            } else if (validLangMap[langRaw]) {
                countsValid[validLangMap[langRaw]] = (countsValid[validLangMap[langRaw]] || 0) + 1;
            } else {
                countsNoise[langRaw] = (countsNoise[langRaw] || 0) + 1;
            }
            if (samples.length < SAMPLE_LIMIT) {
                samples.push({ line: lineNo, word: entry.word, etym });
            }
            continue;
        }

        // proto-language mentions
        for (const [key, norm] of Object.entries(protoMap)) {
            if (etym.toLowerCase().includes(key)) {
                countsProto[norm] = (countsProto[norm] || 0) + 1;
                matched = true;
                break;
            }
        }
        if (matched) continue;

        // language mentions
        for (const [code, name] of Object.entries(validLangMap)) {
            if (etym.toLowerCase().includes(name.toLowerCase())) {
                countsValid[name] = (countsValid[name] || 0) + 1;
                matched = true;
                break;
            }
        }
        if (!matched) {
            countsNoise[etym.slice(0, 20)] = (countsNoise[etym.slice(0, 20)] || 0) + 1;
        }
        if (samples.length < SAMPLE_LIMIT) {
            samples.push({ line: lineNo, word: entry.word, etym });
        }
    }

    function sortCounts(obj: Record<string, number>) {
        return Object.entries(obj).sort((a, b) => b[1] - a[1]);
    }

    console.log("\n=== Valid languages ===");
    sortCounts(countsValid).forEach(([k, v]) => console.log(k.padEnd(20), v));

    console.log("\n=== Proto-languages ===");
    sortCounts(countsProto).forEach(([k, v]) => console.log(k.padEnd(20), v));

    console.log("\n=== Noise / other ===");
    sortCounts(countsNoise).slice(0, 50).forEach(([k, v]) => console.log(k.padEnd(20), v));

    console.log("\n=== Sample entries ===");
    samples.forEach((s) => console.log(`Line ${s.line}: ${s.word} -> ${s.etym}`));
}

main().catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
});
