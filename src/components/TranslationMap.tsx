import { onMount, onCleanup, createEffect } from "solid-js";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

import styles from "./TranslationMap.module.css";
import { languages } from "~/lib/langs";
import type { Translation, WordDefinition } from "~/types";

type Props = {
    subject: WordDefinition[];
    translations: Translation[];
};

export default function TranslationMap(props: Props) {
    let mapContainer: HTMLDivElement | undefined;
    let map: maplibregl.Map | undefined;
    const markers: maplibregl.Marker[] = [];

    const addMarker = (lat: number, lng: number, html: string) => {
        const el = document.createElement("div");
        el.className = styles["map-marker"];
        el.innerHTML = html;

        const marker = new maplibregl.Marker({ element: el })
            .setLngLat([lng, lat])
            .addTo(map!);

        markers.push(marker);
    };

    onMount(() => {
        map = new maplibregl.Map({
            container: mapContainer!,
            style: "https://demotiles.maplibre.org/style.json",
            center: [10, 57],
            zoom: 4
        });
    });

    createEffect(() => {
        if (!map) return;

        // Remove old markers
        markers.forEach(m => m.remove());
        markers.length = 0;

        // Group translations by language
        const grouped: Record<string, Translation[]> = {};
        props.translations.forEach(tr => {
            if (!grouped[tr.lang]) grouped[tr.lang] = [];
            grouped[tr.lang].push(tr);
        });

        // Add translation markers
        Object.entries(grouped).forEach(([langCode, trs]) => {
            const lang = languages[langCode];
            if (!lang) return;

            const tableRows = trs.map(tr =>
                `<tr>
                    <td>${tr.year_start}–${tr.year_end}</td>
                    <td>${tr.translation}</td>
                </tr>`
            ).join("");

            const html = `
                <article class="fill">
                    <div class="row top-align">
                        <div class="large">
                            <h5><span class="fi fi-${lang.countryCode}"></span></h5>
                        </div>
                        <div class="max">
                            <table class="table table-striped table-hover small-space">
                                <tbody>
                                    ${tableRows}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </article>
            `;

            addMarker(lang.coords[0], lang.coords[1], html);
        });

        // Add subject word definitions (all in same language) as a single marker
        if (props.subject?.length) {
            const defLang = languages[props.subject[0].lang];
            if (defLang) {
                const tableRows = props.subject.map(def =>
                    `<tr>
                        <td>${def.year_start}–${def.year_end}</td>
                        <td>${def.word} (${def.pos})</td>
                    </tr>`
                ).join("");

                const html = `
                    <article class="fill">
                        <div class="row top-align">
                            <div class="large">
                                <h5><span class="fi fi-${defLang.countryCode}"></span></h5>
                            </div>
                            <div class="max">
                                <table class="table table-striped table-hover small-space">
                                    <tbody>
                                        ${tableRows}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </article>
                `;
                addMarker(defLang.coords[0], defLang.coords[1], html);
            }
        }
    });

    onCleanup(() => {
        markers.forEach(m => m.remove());
        map?.remove();
    });

    return <div ref={mapContainer} class={styles.map} />;
}
