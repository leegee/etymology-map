// scripts/build-fallback-lang-map.tsx
import fs from "fs";
import Database from "better-sqlite3";
import { iso6393 } from "iso-639-3";
import { languages } from "../src/lib/langs"; // adjust path
import { OFFLINE_DB_PATH } from "../src/config";

const OUTPUT_PATH = "./src/lib/lang-key-mappings.json";

const db = new Database(OFFLINE_DB_PATH, { readonly: true });

// Build set of ISO codes used in DB
const isoCodesInDB = new Set<string>();
db.prepare("SELECT DISTINCT lang FROM words").all().forEach((r: any) => isoCodesInDB.add(r.lang));

// Build ISO lookup map
const isoMap = Object.fromEntries(iso6393.map(l => [l.iso6393, l]));

// Fallback for custom codes not in ISO
const fallback: Record<string, string> = {};

// Map langs keys to DB codes
const langKeyToDbCode: Record<string, string> = {};
const dbCodeToLangKey: Record<string, string> = {};

for (const [key, lang] of Object.entries(languages)) {
    let code = key;

    // Check ISO-639-3 first
    if (isoMap[code]) {
        langKeyToDbCode[key] = code;
        dbCodeToLangKey[code] = key;
        continue;
    }

    // Check if code exists in DB
    if (isoCodesInDB.has(code)) {
        langKeyToDbCode[key] = code;
        dbCodeToLangKey[code] = key;
        continue;
    }

    // Not in ISO or DB → fallback
    fallback[key] = code;
    console.warn(`Lang key "${key}" not found in ISO-639-3 or DB, added to fallback.`);
}

fs.writeFileSync(
    OUTPUT_PATH,
    JSON.stringify({ langKeyToDbCode, dbCodeToLangKey, fallback }, null, 2),
    "utf-8"
);

console.log("Mappings written to", OUTPUT_PATH);

export function getLanguageByCode(code: string) {
    // Try ISO module first
    if (isoMap[code]) return isoMap[code];
    // Fallback to our mapping
    const key = dbCodeToLangKey[code];
    if (key) return languages[key];
    return undefined;
}

export function getCodeByLanguageKey(key: string) {
    // Try ISO module first
    if (isoMap[key]) return key;
    // Fallback to mapping
    return langKeyToDbCode[key] || fallback[key];
}

console.log(getLanguageByCode('ang'))
console.log(getCodeByLanguageKey('ang'))