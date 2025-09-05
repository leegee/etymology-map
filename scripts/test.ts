import fs from "fs";
import readline from "readline";

const PATH = "./data/kaikki.org-dictionary-English.jsonl";

async function findProtoLanguages() {
    const protoCounts: Record<string, number> = {};

    const fileStream = fs.createReadStream(PATH);
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity,
    });

    for await (const line of rl) {
        if (!line.trim()) continue;
        try {
            const entry = JSON.parse(line);
            const lang = entry.lang || entry.language || "";
            if (lang.toLowerCase().startsWith("proto")) {
                protoCounts[lang] = (protoCounts[lang] || 0) + 1;
            }
        } catch (err) {
            console.error("JSON parse error:", err);
        }
    }

    const sortedProtos = Object.entries(protoCounts).sort((a, b) => b[1] - a[1]);
    console.log("=== Proto-language strings in dataset ===");
    sortedProtos.forEach(([proto, count]) => console.log(`${proto} \t ${count}`));
}

findProtoLanguages();
