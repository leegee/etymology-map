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
            center: [10, 50],
            zoom: 4
        });
    });

    createEffect(() => {
        if (!map || !props.translations) return;

        // Remove old markers safely
        markers.forEach(m => {
            if (m.remove) m.remove();
        });
        markers.length = 0;

        // Add new markers
        props.translations.forEach(tr => {
            const lang = languages[tr.lang];
            if (!lang) return;

            const el = document.createElement("div");
            el.className = styles["map-marker"];
            el.innerHTML = `
                <article class="fill">
                    <div class="row">
                        <span class="fi fi-${lang.countryCode}"></span>
                        <div class="max">
                            <h6>${tr.translation}</h6>
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
