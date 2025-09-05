import { onMount, onCleanup, createEffect, createSignal, For, JSX } from "solid-js";
import { Portal, render } from "solid-js/web";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

import styles from "./TranslationMap.module.css";
import { languages } from "~/lib/langs";
import type { Translation, SubjectDefinition } from "~/types";

// Don't include in zoom-to-bounds, as it skews the lovely northern map view
const IGNORE_SOUTH_AFRICA = true;

type Props = {
    subject: SubjectDefinition[];
    translations: Translation[];
    zoom: number;
};

export default function TranslationMap(props: Props) {
    let mapContainer: HTMLDivElement | undefined;
    let map: maplibregl.Map | undefined;
    const markers: maplibregl.Marker[] = [];

    // helper to create a marker with Solid content
    const addMarker = (lat: number, lng: number, content: () => JSX.Element) => {
        const markerEl = document.createElement("div");
        markerEl.className = styles["map-marker"];
        markerEl.style.cursor = "default";

        // render Solid JSX into this marker element
        render(content, markerEl);

        const marker = new maplibregl.Marker({ element: markerEl })
            .setLngLat([lng, lat])
            .addTo(map!);

        markers.push(marker);
    };

    onMount(() => {
        map = new maplibregl.Map({
            container: mapContainer!,
            style: "https://demotiles.maplibre.org/style.json",
            center: [5, 60],
            zoom: 4,
        });

        map.getCanvas().style.cursor = "default";
    });

    createEffect(() => {
        if (!map) return;

        const currentSubjects = props.subject;
        const currentTranslations = props.translations;

        if (!currentSubjects.length && !currentTranslations.length) return;

        const bounds = new maplibregl.LngLatBounds();

        // Remove old markers
        markers.forEach((m) => m.remove());
        markers.length = 0;

        // Group translations by language
        const grouped: Record<string, Translation[]> = {};
        currentTranslations.forEach((tr) => {
            if (!grouped[tr.lang]) grouped[tr.lang] = [];
            grouped[tr.lang].push(tr);
        });

        // Add translation markers
        Object.entries(grouped).forEach(([langCode, trs]) => {
            const lang = languages[langCode];
            if (!lang) return;

            const scrollClasses = () => {
                const tooMany = trs.length > 2;
                const tooLong = trs.some(tr => (tr.translation?.length ?? 0) > 100); // adjust 100 chars as threshold
                return (tooMany || tooLong) ? 'small-height scroll' : '';
            };

            if (!IGNORE_SOUTH_AFRICA || lang.countryCode !== 'za') bounds.extend({ lat: lang.coords[0], lng: lang.coords[1] });

            addMarker(lang.coords[0], lang.coords[1], () => {
                return (
                    <article class="fill small-padding" style={{ zoom: props.zoom }}>
                        <div class="row top-align ${scroll}">
                            <div class="large">
                                <h5 title={lang.englishName}>
                                    <span class={`fi fi-${lang.countryCode}`}></span>
                                </h5>
                                <div class="tooltip">{lang.englishName}</div>
                            </div>

                            <div class={"small-width " + scrollClasses()}>
                                <table class="small-space small-width">
                                    <tbody>
                                        <For each={trs}>
                                            {(tr) => (
                                                <tr>
                                                    <th class="top-align">{tr.year_start ?? ""}–{tr.year_end ?? ""}</th>
                                                    <td>{tr.translation}</td>
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
                const [open, setOpen] = createSignal(false);
                return (
                    <>
                        <article class="secondary" style={{ zoom: props.zoom }}>
                            <h4 title={defLang.countryCode} onClick={() => setOpen(true)}>
                                <span class={`fi fi-${defLang.countryCode}`}></span>
                                <div class="tooltip">{defLang.englishName} search subject</div>
                                &nbsp;
                                {currentSubjects.map(s => s.word).join(', ')}
                            </h4>
                        </article >

                        <Portal mount={document.body}>
                            <dialog class="top" open={open()} onClick={(e) => e.stopPropagation()}>
                                <h5>Etymology</h5>
                                <div>
                                    <table class="table">
                                        <thead />
                                        <tbody>
                                            <For each={currentSubjects}>
                                                {(def) => (
                                                    <>
                                                        <tr>
                                                            <td>{def.year_start ?? ""}–{def.year_end ?? ""} &mdash; {def.word} ({def.pos})</td>
                                                        </tr>
                                                        <tr>
                                                            <td>{def.etymology}</td>
                                                        </tr>
                                                    </>
                                                )}
                                            </For>
                                        </tbody>
                                    </table>
                                </div>
                                <nav class="right-align">
                                    <button class="transparent link" onClick={() => setOpen(false)}>Close</button>
                                </nav>
                            </dialog>
                        </Portal>
                    </>
                );
            });

            map.fitBounds(bounds, {
                padding: 20
            });
        }
    });

    onCleanup(() => {
        markers.forEach((m) => m.remove());
        map?.remove();
    });

    return <div ref={mapContainer} class={styles.map} />;
}
