import { SubjectDefinition, Translation } from "~/types";

export function normalizeWords(
    subjects: SubjectDefinition[],
    translations: Translation[]
): { subjects: SubjectDefinition[]; translations: Translation[] } {
    const currentYear = new Date().getFullYear();

    // --- Normalize subjects ---
    const normalizedSubjects = subjects.map(s => ({
        ...s,
        year_start: s.year_start === 9999 || s.year_start == null ? currentYear : s.year_start,
        year_end: s.year_end === 9999 || s.year_end == null ? currentYear : s.year_end
    }));

    // --- Normalize and group translations ---
    const grouped = new Map<string, string[]>(); // key = `${lang}-${yearStart}-${yearEnd}`

    translations.forEach(t => {
        const start = t.year_start === 9999 || t.year_start == null ? currentYear : t.year_start;
        const end = t.year_end === 9999 || t.year_end == null ? currentYear : t.year_end;

        const key = `${t.lang}-${start}-${end}`;
        if (!grouped.has(key)) grouped.set(key, []);
        grouped.get(key)!.push(t.translation);
    });

    const normalizedTranslations: Translation[] = Array.from(grouped.entries()).map(
        ([key, words]) => {
            const [lang, startStr, endStr] = key.split("-");
            return {
                id: 0, // placeholder, can be ignored
                word_id: 0, // placeholder
                translation: words.join("; "),
                lang,
                year_start: Number(startStr),
                year_end: Number(endStr)
            };
        }
    );

    return { subjects: normalizedSubjects, translations: normalizedTranslations };
}
