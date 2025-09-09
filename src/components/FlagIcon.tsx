import { Switch, Match } from "solid-js";
import styles from "./FlagIcon.module.css";
import { getLanguage } from "../lib/langs";

interface flagIconProps {
    langCode: string;
}

export default function flagIcon(props: flagIconProps) {
    const langMeta = getLanguage(props.langCode);
    return (
        <Switch fallback={
            <span class={styles["icon-flag"]}>{langMeta.flag}</span>
        }>
            <Match when={langMeta.countryCode !== 'xx' && !langMeta.useFlag}>
                <span class={`fi fi-${langMeta.countryCode}`}></span>
            </Match>
        </Switch>
    );
}
