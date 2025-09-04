import { onMount, onCleanup, createEffect } from "solid-js";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

import styles from "./TranslationMap.module.css";
import { languages } from "~/lib/langs";
import type { Translation, SubjectDefinition } from "~/types";

type Props = {
    subject: SubjectDefinition[];
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

            const scrollClass = trs.length > 2 ? "scroll small-height" : "";

            const html = `
                <article class="fill">
                    <div class="row top-align">
                        <div class="large">
                            <h5 title="${lang.englishName}"><span class="fi fi-${lang.countryCode}"></span></h5>
                        </div>
                        <div class="${scrollClass}">
                            <table class="border table-striped table-hover small-space">
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

        // Add subject word definitions as a single marker
        console.log('subject', props.subject.length)
        if (props.subject?.length) {
            console.log('subject =', props.subject, props.subject[0])
            const defLang = languages[props.subject[0].lang];
            if (defLang) {
                const tableRows = props.subject.map(def =>
                    `<tr>
                    <td>${def.year_start}–${def.year_end}</td>
                    <td>${def.word} (${def.pos})</td>
                    <td>${def.etymology}</td>
                    </tr>`
                ).join("");

                const scrollClass = props.subject.length > 2 ? "scroll small-height" : "";

                const html = `
                    <article class="fill">
                        <div class="row top-align">
                            <div class="large">
                                <h5 title="${defLang.countryCode}"><span class="fi fi-${defLang.countryCode}"></span></h5>
                            </div>
                            <div class="${scrollClass}">
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
                console.log(defLang.coords[0], defLang.coords[1], html);
            }
        }
    });

    onCleanup(() => {
        markers.forEach(m => m.remove());
        map?.remove();
    });

    return <div ref={mapContainer} class={styles.map} />;
}
