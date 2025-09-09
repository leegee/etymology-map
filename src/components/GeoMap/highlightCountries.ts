import maplibregl from "maplibre-gl";
import type { WorldLink, SubjectDefinition } from "../../types";
import { getLanguage } from "../../lib/langs";

export function highlightCountries(
    subjects: SubjectDefinition[],
    links: WorldLink[],
    map: maplibregl.Map
) {
    if (!map) return;

    const highlightedCountries = new Set<string>();

    links.forEach(tr => {
        const lang = getLanguage(tr.lang);
        if (lang?.countryCode) highlightedCountries.add(lang.countryCode.toUpperCase());
    });

    subjects.forEach(s => {
        const lang = getLanguage(s.lang);
        if (lang?.countryCode) highlightedCountries.add(lang.countryCode.toUpperCase());
    });

    map.setPaintProperty("countries-fill", "fill-color", [
        "case",
        ["in", ["get", "iso_a2"], ["literal", Array.from(highlightedCountries)]],
        "#5f5",    // highlighted countries
        "#006400"  // default
    ]);

    map.setPaintProperty("countries-fill", "fill-opacity", 0.4);
}
