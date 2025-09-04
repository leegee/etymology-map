import { Show } from "solid-js";
import { langauges } from "~/lib/langs";
import { Translation } from "~/types";

type Props = {
    translations: Translation[];
};

export default function TranslationList(props: Props) {
    return (
        <Show when={props.translations.length}>
            <div class="center padding medium-width">
                <h2>Results</h2>
                {props.translations.map(tr => (
                    <div class="row" lang={tr.lang}>
                        <div class={'fl fl-' + tr.lang}></div>
                        <div>{langauges[tr.lang].flag}</div>
                        <div>{tr.lang}</div>
                        <div>{tr.translation}</div>
                    </div>
                ))
                }
            </div>
        </Show>
    );
}
