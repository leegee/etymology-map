import { onMount, onCleanup, createEffect, createSignal, For, JSX } from "solid-js";
import { Portal, render } from "solid-js/web";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

import styles from "./Map.module.css";
import type { WorldLink, SubjectDefinition } from "../types";
import { languages } from "../lib/langs";
import { yearLabel } from "../lib/year-label";
import FlagIcon from "./FlagIcon";

// Don't include in zoom-to-bounds, as it skews the lovely northern map view
const IGNORE_SOUTH_AFRICA = true;

type Props = {
    subject: SubjectDefinition[];
    wordLinks: WorldLink[];
    zoom: number;
};

export default function GeoMap(props: Props) {
    let mapContainer: HTMLDivElement | undefined;
    let map: maplibregl.Map | undefined;
    const markers: maplibregl.Marker[] = [];

    const [open, setOpen] = createSignal(false);

    const addMarker = (lat: number, lng: number, content: () => JSX.Element) => {
        const markerEl = document.createElement("div");
        markerEl.className = styles["map-marker"];
        markerEl.style.cursor = "default";

        render(content, markerEl);

        const marker = new maplibregl.Marker({ element: markerEl })
            .setLngLat([lng, lat])
            .addTo(map!);

        markers.push(marker);
    };

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

        map.addSource("countries", {
            type: "geojson",
            data: "countries.min.geojson"
        });

        map.addLayer({
            id: "countries-fill",
            type: "fill",
            source: "countries",
            paint: {
                "fill-color": "#088", // Initial colour
                "fill-opacity": 0.2
            }
        });

        map.getCanvas().style.cursor = "default";
    });

    createEffect(() => {
        if (!map) return;

        setOpen(false);

        // console.log("Subject: ", props.subject);
        // console.log("wordLinks: ", props.wordLinks);

        const currentSubjects = props.subject;
        const currentwordLinks = props.wordLinks;

        if (!currentSubjects.length && !currentwordLinks.length) return;

        const highlightedCountries = new Set<string>();

        currentwordLinks.forEach(tr => {
            const lang = languages[tr.lang];
            if (lang?.countryCode) highlightedCountries.add(lang.countryCode.toUpperCase());
        });

        currentSubjects.forEach(s => {
            const lang = languages[s.lang];
            if (lang?.countryCode) highlightedCountries.add(lang.countryCode.toUpperCase());
        });

        // Set untries fill color 
        map.setPaintProperty("countries-fill", "fill-color", [
            "case",
            ["in", ["get", "iso_a2"], ["literal", Array.from(highlightedCountries)]],
            "#5f5",
            "#006400"
        ]);

        map.setPaintProperty("countries-fill", "fill-opacity", 0.4);


        const bounds = new maplibregl.LngLatBounds();

        // Remove old markers
        markers.forEach((m) => m.remove());
        markers.length = 0;

        // Group wordLinks by language
        const grouped: Record<string, WorldLink[]> = {};
        currentwordLinks.forEach((tr) => {
            if (!grouped[tr.lang]) grouped[tr.lang] = [];
            grouped[tr.lang].push(tr);
        });

        // Add linked_word markers
        Object.entries(grouped).forEach(([langCode, trs]) => {
            console.log(trs)
            const lang = languages[langCode];
            if (!lang) return;

            const scrollClasses = () => {
                const tooMany = trs.length > 2;
                const tooLong = trs.some(tr => (tr.linked_word?.length ?? 0) > 150);
                return (tooMany || tooLong) ? 'small-height scroll' : '';
            };

            if (!IGNORE_SOUTH_AFRICA || lang.countryCode !== 'za') {
                bounds.extend({ lat: lang.coords[0], lng: lang.coords[1] });
            }

            addMarker(lang.coords[0], lang.coords[1], () => {
                return (
                    <article class="fill small-padding" style={{ zoom: props.zoom }}>
                        <div class="row top-align ${scroll}">
                            <div class="large">
                                <h5 title={lang.englishName}>
                                    <FlagIcon langCode={langCode} />
                                </h5>
                                <div class="tooltip">{lang.englishName}</div>
                            </div>

                            <div class={"small-width " + scrollClasses()}>
                                <table class="small-space small-width">
                                    <tbody>
                                        <For each={trs}>
                                            {(tr) => (
                                                <tr>
                                                    <th class="top-align">
                                                        {yearLabel(tr.year_start)}
                                                        –
                                                        {yearLabel(tr.year_end)}
                                                    </th>
                                                    <td>
                                                        <a title="View on Wiktionary" class="large" target="blank" href={`https://en.wiktionary.org/wiki/${tr.linked_word}#${lang.englishName}`}>
                                                            {tr.linked_word}
                                                        </a>
                                                    </td>
                                                </tr>
                                            )}
                                        </For>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </article>
                );
            });
        });

        // Add subjects / etymology marker
        if (currentSubjects.length) {
            const defLang = languages[currentSubjects[0].lang];
            if (!defLang) return;

            bounds.extend({ lat: defLang.coords[0], lng: defLang.coords[1] });

            addMarker(defLang.coords[0], defLang.coords[1], () => {
                return (
                    <>
                        <article class="secondary" style={{ zoom: props.zoom }}>
                            <h4 title={defLang.countryCode} onClick={() => setOpen(true)}>
                                <FlagIcon langCode={currentSubjects[0].lang} />
                                <div class="tooltip">{defLang.englishName} search subject</div>
                                &nbsp;
                                {currentSubjects.map(s => s.word).join(', ')}
                            </h4>
                        </article >

                        <Portal mount={document.body}>
                            <dialog class="top padding medium-width" open={open()}>
                                <For each={currentSubjects}>
                                    {(def) => (
                                        <>
                                            <nav>
                                                <h5 class="max left-align bottom-padding">
                                                    {def.word}
                                                    &nbsp;
                                                    ({def.pos})
                                                    <br />
                                                    <small>
                                                        {def.year_start ?? ""}–{def.year_end ?? ""}
                                                    </small>
                                                </h5>
                                                <button class="transparent link" onClick={() => setOpen(false)}><i>close</i></button>
                                            </nav>

                                            <div class="bottom-padding scroll">{def.etymology}</div>
                                        </>
                                    )}
                                </For>
                                <nav class="right-align">
                                    <button class="transparent link" onClick={() => setOpen(false)}>Close</button>
                                </nav>
                            </dialog>
                        </Portal >
                    </>
                );
            });


            if (props.wordLinks.length && !bounds.isEmpty()) {
                // map.fitBounds(bounds, { padding: 100 });
                map.fitBounds(bounds, {
                    padding: 100,
                    duration: 1400,
                    easing: (t) => t * (2 - t),
                });

            }
        }
    });

    onCleanup(() => {
        markers.forEach((m) => m.remove());
        map?.remove();
    });

    return <div ref={mapContainer} class={styles.map} />;
}
