import { SubjectDefinition, Translation } from "~/types";

export function normalizeWords(
    translations: Translation[]
): Translation[] {
    const currentYear = new Date().getFullYear();
    const grouped = new Map<string, string[]>(); // key = `${lang}-${yearStart}-${yearEnd}`

    translations.forEach(t => {
        const start = (t.year_start === 9999 || t.year_start == null) ? currentYear : t.year_start;
        const end = (t.year_end === 9999 || t.year_end == null) ? currentYear : t.year_end;
        const key = `${t.lang}|${start}|${end}`;
        if (!grouped.has(key)) grouped.set(key, []);
        grouped.get(key)!.push(t.translation);
    });

    const normalizedTranslations: Translation[] = Array.from(grouped.entries()).map(
        ([key, words]) => {
            const [lang, startStr, endStr] = key.split("|");
            return {
                id: 0, // placeholder
                word_id: 0, // placeholder
                translation: words.join("; "),
                lang,
                year_start: Number(startStr),
                year_end: Number(endStr)
            };
        }
    );

    return normalizedTranslations;
}
