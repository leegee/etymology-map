import type { SubjectDefinition, WorldLink } from "../types";
import { getLanguage } from "./langs";


export function normaliseSubjects(subjects: SubjectDefinition[]): SubjectDefinition[] {
    return subjects.map(s => {
        const lang = getLanguage(s.lang);
        return {
            ...s,
            year_start: lang.yearRange[0],
            year_end: lang.yearRange[1],
        };
    });
}

export function normalizeWords(
    wordLinks: WorldLink[]
): WorldLink[] {
    const grouped = new Map<string, string[]>(); // key = `${lang}-${yearStart}-${yearEnd}`

    wordLinks.forEach(t => {
        const lang = getLanguage(t.lang);
        const trans = {
            ...t,
            year_start: lang.yearRange[0],
            year_end: lang.yearRange[1]
        };
        const key = `${trans.lang}|${trans.year_start}|${trans.year_end}`;
        if (!grouped.has(key)) grouped.set(key, []);
        grouped.get(key)!.push(t.linked_word);
    });

    const normalizedwordLinks: WorldLink[] = Array.from(grouped.entries()).map(
        ([key, words]) => {
            const [lang, startStr, endStr] = key.split("|");
            return {
                id: 0, // placeholder
                word_id: 0, // placeholder
                linked_word: words.join("; "),
                lang,
                year_start: Number(startStr),
                year_end: Number(endStr),
            };
        }
    );

    return normalizedwordLinks;
}
