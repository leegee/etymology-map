import { Show } from "solid-js";
import { languages } from "~/lib/langs";
import { Translation } from "~/types";

type Props = {
    translations: Translation[];
};

export default function TranslationList(props: Props) {
    return (
        <Show when={props.translations.length}>
            <div class="center padding medium-width">
                <h2>Results</h2>
                {props.translations.map((tr) => {
                    const lang = languages[tr.lang];
                    return (
                        <div class="row" lang={tr.lang}>
                            <div class="row align-center gap">
                                <span class={`fi fi-${lang.countryCode}`}></span>
                                <span>{lang.englishName}</span>
                            </div>
                            <div class="card-text">{tr.translation}</div>
                        </div>

                    );
                })}
            </div>
        </Show>
    );
}
