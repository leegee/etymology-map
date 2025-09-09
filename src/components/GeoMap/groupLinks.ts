import type { WorldLink } from "../../types";

export function groupWordLinksByLang(links: WorldLink[]): Record<string, WorldLink[]> {
    const grouped: Record<string, WorldLink[]> = {};
    links.forEach(tr => {
        if (!grouped[tr.lang]) grouped[tr.lang] = [];
        grouped[tr.lang].push(tr);
    });
    return grouped;
}
