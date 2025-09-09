import maplibregl from "maplibre-gl";
import type { WorldLink } from "../../types";
import { getLanguage } from "../../lib/langs";

export function drawLines(grouped: Record<string, WorldLink[]>, map: maplibregl.Map) {
    if (!map) return;

    map.getStyle().layers?.forEach(layer => {
        if (layer.id.startsWith("line-layer-") || layer.id.startsWith("line-arrow-")) {
            if (map.getLayer(layer.id)) map.removeLayer(layer.id);
        }
    });

    Object.keys(map.getStyle().sources).forEach(sourceId => {
        if (sourceId.startsWith("line-")) map.removeSource(sourceId);
    });

    Object.entries(grouped).forEach(([langCode, trs]) => {
        if (trs.length < 2) return;

        const sortedLinks = trs.slice().sort((a, b) => (a.year_start ?? 0) - (b.year_start ?? 0));

        const coords: [number, number][] = sortedLinks.map(tr => {
            const l = getLanguage(tr.lang);
            return [l.coords[1], l.coords[0]];
        });

        map.addSource(`line-${langCode}`, {
            type: "geojson",
            data: {
                type: "Feature",
                properties: {},
                geometry: { type: "LineString", coordinates: coords }
            }
        });

        console.log("line", coords)

        map.addLayer({
            id: `line-layer-${langCode}`,
            type: "line",
            source: `line-${langCode}`,
            layout: { "line-cap": "round", "line-join": "round" },
            paint: { "line-color": "#fff", "line-width": 12 }
        });

        // Arrow symbols along the line
        map.addLayer({
            id: `line-arrow-${langCode}`,
            type: "symbol",
            source: `line-${langCode}`,
            layout: {
                "symbol-placement": "line",
                "symbol-spacing": 50,
                "icon-image": "triangle-15",
                "icon-allow-overlap": true,
                "icon-ignore-placement": true,
                "icon-rotate": 90
            }
        });
    });
}
