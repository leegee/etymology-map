import fs from "fs";
import readline from "readline";

const PATH = "./data/kaikki.org-dictionary-English.jsonl";

// whitelist of recognized languages
const LANGUAGE_WHITELIST = new Set([
    "latin", "french", "italian", "german", "spanish", "japanese", "arabic",
    "polish", "dutch", "romanian", "sanskrit", "russian", "hebrew", "hindi",
    "mandarin", "english", "swedish", "yiddish", "norwegian", "egyptian",
    "afrikaans", "danish", "icelandic", "coptic", "faroese", "portuguese",
    "persian", "maori", "korean", "czech", "irish", "greek", "malay",
    "armenian", "chinese", "basque", "vietnamese", "tagalog", "scots",
    "welsh", "ukrainian", "tamil", "catalan", "turkish", "hungarian"
]);

// proto-language normalization
function normalizeProto(s: string): string | null {
    s = s.toLowerCase();
    if (s.includes("proto-indo-european") || s.includes("pie")) return "Proto-Indo-European";
    if (s.includes("proto-germanic")) return "Proto-Germanic";
    if (s.includes("proto-west germanic")) return "Proto-West Germanic";
    if (s.includes("proto-slavic")) return "Proto-Slavic";
    if (s.includes("proto-celtic")) return "Proto-Celtic";
    if (s.includes("proto-semitic")) return "Proto-Semitic";
    if (s.includes("proto-italic")) return "Proto-Italic";
    if (s.includes("proto-uralic")) return "Proto-Uralic";
    if (s.includes("proto-norse")) return "Proto-Norse";
    return null;
}

// noise prefixes / adjectives
const NOISE = new Set([
    "old", "middle", "ancient", "late", "medieval", "new", "classical",
    "earlier", "the", "a", "an", "its", "which", "biblical", "byzantine",
    "anglo-norman", "vulgar", "koine", "scottish"
]);

// counters
const validLangs = new Map<string, number>();
const protoLangs = new Map<string, number>();
const noise = new Map<string, number>();

async function main() {
    const rl = readline.createInterface({
        input: fs.createReadStream(PATH),
        crlfDelay: Infinity
    });

    for await (const line of rl) {
        if (!line.trim()) continue;
        const entry = JSON.parse(line);
        if (!entry.etymology_text) continue;

        const text = entry.etymology_text.toLowerCase();

        // crude "from X" extraction
        const matches = [...text.matchAll(/\bfrom ([a-z\- ]+)\b/g)];
        for (const m of matches) {
            let raw = m[1].trim();

            // normalize
            raw = raw.replace(/[^a-z\- ]/g, "").trim();

            // proto?
            const proto = normalizeProto(raw);
            if (proto) {
                protoLangs.set(proto, (protoLangs.get(proto) ?? 0) + 1);
                continue;
            }

            // valid language?
            if (LANGUAGE_WHITELIST.has(raw)) {
                const lang = raw.charAt(0).toUpperCase() + raw.slice(1);
                validLangs.set(lang, (validLangs.get(lang) ?? 0) + 1);
                continue;
            }

            // noise?
            if (NOISE.has(raw)) {
                noise.set(raw, (noise.get(raw) ?? 0) + 1);
                continue;
            }

            // everything else goes into noise for now
            noise.set(raw, (noise.get(raw) ?? 0) + 1);
        }
    }

    // report
    console.log("=== Valid languages ===");
    [...validLangs.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 30)
        .forEach(([lang, count]) =>
            console.log(lang.padEnd(15), count.toLocaleString())
        );

    console.log("\n=== Proto-languages ===");
    [...protoLangs.entries()]
        .sort((a, b) => b[1] - a[1])
        .forEach(([proto, count]) =>
            console.log(proto.padEnd(25), count.toLocaleString())
        );

    console.log("\n=== Noise / other ===");
    [...noise.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 30)
        .forEach(([word, count]) =>
            console.log(word.padEnd(15), count.toLocaleString())
        );
}

main();
