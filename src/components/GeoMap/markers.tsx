import { createSignal, For, type JSX } from "solid-js";
import { Portal, render } from "solid-js/web";
import maplibregl from "maplibre-gl";

import type { SubjectDefinition } from "../../types";
import FlagIcon from "../../components/FlagIcon";
import styles from "../Map.module.css";
import { getLanguage, type Language } from "../../lib/langs";

export function addMarker(
    map: maplibregl.Map,
    markers: maplibregl.Marker[],
    lang: Language,
    content: () => JSX.Element
) {
    const markerEl = document.createElement("div");
    markerEl.className = styles["map-marker"];
    markerEl.style.cursor = "default";

    const marker = new maplibregl.Marker({ element: markerEl })
        .setLngLat([lang.coords[1], lang.coords[0]])
        .addTo(map);

    markers.push(marker);

    render(content, markerEl);
}


export function addSubjectMarker(
    map: maplibregl.Map,
    markers: maplibregl.Marker[],
    subjects: SubjectDefinition[],
    bounds: maplibregl.LngLatBounds,
    zoom: number
) {
    if (!subjects.length) return;

    const [open, setOpen] = createSignal(false);

    const langObj = getLanguage(subjects[0].lang);
    if (!langObj) return;

    const lat = langObj.coords[0];
    const lng = langObj.coords[1];

    bounds.extend({ lat, lng });

    const markerEl = document.createElement("div");
    markerEl.className = styles["map-marker"];
    markerEl.style.cursor = "default";

    const marker = new maplibregl.Marker({ element: markerEl })
        .setLngLat([lng, lat])
        .addTo(map);

    markers.push(marker);

    render(() => (
        <>
            <article class="secondary" style={{ zoom }}>
                <h4 onClick={() => setOpen(true)}>
                    <FlagIcon langCode={subjects[0].lang} />
                    <div class="tooltip">{langObj.englishName} search subject</div>
                    &nbsp;
                    {subjects.map(s => s.word).join(', ')}
                </h4>
            </article>

            <Portal mount={document.body}>
                <dialog class="top padding medium-width" open={open()}>
                    <For each={subjects}>
                        {(def) => (
                            <>
                                <nav class={styles.etymologyHeader + ' sticky'}>
                                    <h5 class="max left-align bottom-padding">
                                        {def.word} &nbsp; <em title="Part of speech">({def.pos})</em><br />
                                        <small>{def.year_start ?? ""}–{def.year_end ?? ""}</small>
                                    </h5>
                                    <button class="transparent link" onClick={() => setOpen(false)}><i>close</i></button>
                                </nav>
                                <div class={"bottom-padding scroll " + styles.etymology}>
                                    {def.etymology?.split(/[\n\r\f]+/).map(text => (<p>{text}</p>))}
                                </div>
                            </>
                        )}
                    </For>
                    <nav class="right-align">
                        <button class="transparent link" onClick={() => setOpen(false)}>Close</button>
                    </nav>
                </dialog>
            </Portal>
        </>
    ), markerEl);
}
