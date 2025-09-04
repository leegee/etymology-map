import { isServer } from "solid-js/web";

import { onMount, onCleanup } from "solid-js";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { languages } from "~/lib/langs";
import type { Translation } from "~/types";

const { Marker, NavigationControl } = maplibregl;

type Props = {
    translations: Translation[];
};

export default function TranslationMap(props: Props) {
    let mapContainer: HTMLDivElement | undefined;
    let map: maplibregl.Map | undefined;

    onMount(() => {
        if (isServer) return;

        map = new maplibregl.Map({
            container: mapContainer!,
            style: "https://demotiles.maplibre.org/style.json",
            center: [10, 50], // Europe
            zoom: 3,
        });

        // Add zoom + rotation controls
        map.addControl(new maplibregl.NavigationControl(), "top-right");

        // Add markers for each translation
        props.translations.forEach((tr) => {
            const lang = languages[tr.lang];
            if (!lang) return;

            new Marker()
                .setLngLat([lang.coords[1], lang.coords[0]])
                .setPopup(
                    new maplibregl.Popup().setHTML(
                        `<strong>${lang.englishName}</strong><br>${tr.translation}`
                    )
                )
                .addTo(map!);
        });
    });

    onCleanup(() => {
        map?.remove();
    });

    return <div ref={mapContainer} style={{ width: "100%", height: "100%" }} />;
}
