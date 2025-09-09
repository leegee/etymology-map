import { onMount, onCleanup, createEffect } from "solid-js";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

import styles from "./Map.module.css";
import type { WorldLink, SubjectDefinition } from "../types";
import { getLanguage } from "../lib/langs";
import { highlightCountries } from "./GeoMap/highlightCountries";
import { groupWordLinksByLang } from "./GeoMap/groupLinks";
import WordLinkMarker from "./GeoMap/WordLinkMarker";
import { addMarker, addSubjectMarker } from "./GeoMap/markers";

const IGNORE_SOUTH_AFRICA = true;

type Props = {
    subject: SubjectDefinition[];
    wordLinks: WorldLink[];
    zoom: number;
    lines?: boolean;
};

export default function GeoMap(props: Props) {
    let mapContainer: HTMLDivElement | undefined;
    let map: maplibregl.Map | undefined;
    const markers: maplibregl.Marker[] = [];

    onMount(() => {
        map = new maplibregl.Map({
            container: mapContainer!,
            center: [5, 60],
            zoom: 4,
            dragPan: true,
            dragRotate: true,
            scrollZoom: true,
            doubleClickZoom: true,
            touchZoomRotate: true,
        });

        map.addSource("countries", { type: "geojson", data: "countries.min.geojson" });

        map.addLayer({
            id: "countries-fill",
            type: "fill",
            source: "countries",
            paint: { "fill-color": "#088", "fill-opacity": 0.2 },
        });

        map.getCanvas().style.cursor = "default";
    });

    createEffect(() => {
        if (!map) return;

        const bounds = new maplibregl.LngLatBounds();
        const grouped = groupWordLinksByLang(props.wordLinks);

        highlightCountries(props.subject, props.wordLinks, map);

        Object.entries(grouped).forEach(([langCode, trs]) => {
            const lang = getLanguage(langCode);
            if (!lang) return;

            if (!IGNORE_SOUTH_AFRICA || lang.countryCode !== 'za') {
                bounds.extend({ lat: lang.coords[0], lng: lang.coords[1] });
            }

            addMarker(map!, markers, lang, () => (
                <WordLinkMarker links={trs} lang={lang} langCode={langCode} zoom={props.zoom} />
            ));
        });

        addSubjectMarker(map!, markers, props.subject, bounds, props.zoom);

        if (props.lines) {
            import("./GeoMap/lines").then(({ drawLines }) => drawLines(grouped, map!));
        }

        // Todo add  flight animation
        if (!bounds.isEmpty()) {
            map?.fitBounds(bounds, { padding: 100, duration: 1400, easing: t => t * (2 - t) });
        }
    });

    onCleanup(() => {
        markers.forEach(m => m.remove());
        map?.remove();
    });

    return <div ref={mapContainer} class={styles.map} />;
}
