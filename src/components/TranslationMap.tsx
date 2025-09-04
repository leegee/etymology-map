import { onMount, onCleanup, createEffect } from "solid-js";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

import styles from "./TranslationMap.module.css";
import { languages } from "~/lib/langs";
import type { Translation } from "~/types";

type Props = { translations: Translation[] };

export default function TranslationMap(props: Props) {
    let mapContainer: HTMLDivElement | undefined;
    let map: maplibregl.Map | undefined;
    const markers: maplibregl.Marker[] = [];

    onMount(() => {
        map = new maplibregl.Map({
            container: mapContainer!,
            style: "https://demotiles.maplibre.org/style.json",
            center: [10, 57],
            zoom: 4
        });
    });

    createEffect(() => {
        if (!map || !props.translations) return;

        // Remove old markers safely
        markers.forEach(m => m.remove());
        markers.length = 0;

        // Group translations by language
        const grouped: Record<string, Translation[]> = {};
        props.translations.forEach(tr => {
            if (!grouped[tr.lang]) grouped[tr.lang] = [];
            grouped[tr.lang].push(tr);
        });

        // Add markers
        Object.entries(grouped).forEach(([langCode, trs]) => {
            const lang = languages[langCode];
            if (!lang) return;

            const tableRows = trs.map(tr =>
                `<tr>
                    <td>${tr.year_start}–${tr.year_end}</td>
                    <td>${tr.translation}</td>
                </tr>`
            ).join("");

            const el = document.createElement("div");
            el.className = styles["map-marker"];
            el.innerHTML = `
                <article class="fill">
                <div class="row top-align">
                    <div class="large">
                        <h5><span class="fi fi-${lang.countryCode}"></span></h5>
                    </div>
                    <div class="max ">
                        <table class="table table-striped table-hover small-space">
                            <thead/>
                            <tbody>
                                ${tableRows}
                            </tbody>
                        </table>
                    </div>
                </div>
                </article>
            `;

            const marker = new maplibregl.Marker({ element: el })
                .setLngLat([lang.coords[1], lang.coords[0]])
                .addTo(map!);

            markers.push(marker);
        });
    });

    onCleanup(() => {
        markers.forEach(m => m.remove());
        map?.remove();
    });

    return <div ref={mapContainer} class={styles.map} />;
}
