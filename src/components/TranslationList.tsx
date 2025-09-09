import { Show } from "solid-js";
import { getLanguage } from "../lib/langs";
import type { WorldLink } from "../types";

type Props = {
    wordLinks: WorldLink[];
};

export default function WordList(props: Props) {
    return (
        <Show when={props.wordLinks.length}>
            <div class="center padding medium-width">
                <h2>Results</h2>
                {props.wordLinks.map((tr) => {
                    const lang = getLanguage(tr.lang);
                    return (
                        <div class="row" lang={tr.lang}>
                            <div class="row align-center gap">
                                <span class={`fi fi-${lang.countryCode}`}></span>
                                <span>{lang.englishName}</span>
                            </div>
                            <div class="card-text">{tr.linked_word}</div>
                        </div>

                    );
                })}
            </div>
        </Show>
    );
}
