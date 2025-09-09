import { For } from "solid-js";
import type { WorldLink } from "../../types";
import { yearLabel } from "../../lib/year-label";
import FlagIcon from "../FlagIcon";

type Props = {
    links: WorldLink[];
    langCode: string;
    zoom: number;
};

export default function WordLinkMarker(props: Props) {
    const scrollClasses = () => {
        const tooMany = props.links.length > 2;
        const tooLong = props.links.some(tr => (tr.linked_word?.length ?? 0) > 150);
        return (tooMany || tooLong) ? 'small-height scroll' : '';
    };

    return (
        <article class="fill small-padding" style={{ zoom: props.zoom }}>
            <div class={"row middle-align " + scrollClasses()}>
                <div class="large">
                    <h5 title={props.langCode}>
                        <FlagIcon langCode={props.langCode} />
                    </h5>
                    <div class="tooltip">{props.langCode}</div>
                </div>

                <div class={"small-width " + scrollClasses()}>
                    <table class="small-space small-width">
                        <tbody>
                            <For each={props.links}>
                                {(tr) => (
                                    <tr>
                                        <th class="top-align" style={{ "word-break": "break-word" }} innerHTML={
                                            yearLabel(tr.year_start) + '–<br/>' + yearLabel(tr.year_end)
                                        }></th>
                                        <td>
                                            <a title="View on Wiktionary" class="large" target="blank" href={`https://en.wiktionary.org/wiki/${tr.linked_word}#${props.langCode}`}>
                                                {tr.linked_word}
                                            </a>
                                        </td>
                                    </tr>
                                )}
                            </For>
                        </tbody>
                    </table>
                </div>
            </div>
        </article>
    );
}
