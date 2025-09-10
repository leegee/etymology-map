import { createSignal, onMount } from "solid-js";
import styles from './WordSearch.module.css';

type Props = {
    onSearch: (word: string) => void;
    fetchSuggestions: (query: string) => Promise<string[]>;
};

export default function WordSearch(props: Props) {
    let inputRefToFocus: HTMLInputElement | undefined;
    const [value, setValue] = createSignal("");
    const [suggestion, setSuggestion] = createSignal("");

    const submit = (e?: Event) => {
        if (e) e.preventDefault();
        const v = suggestion() || value();
        if (v.trim()) {
            props.onSearch(v.trim());
            setSuggestion("");
        }
    };

    const handleInput = async (e: Event) => {
        const val = (e.target as HTMLInputElement).value;
        setValue(val);

        if (val.trim()) {
            const results = await props.fetchSuggestions(val.trim());
            if (results.length > 0) {
                const first = results[0];
                if (first.toLowerCase().startsWith(val.toLowerCase())) {
                    setSuggestion(first);
                } else {
                    setSuggestion("");
                }
            } else {
                setSuggestion("");
            }
        } else {
            setSuggestion("");
        }
    };

    const acceptSuggestion = () => {
        if (suggestion()) {
            setValue(suggestion());
            setSuggestion("");
        }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
        if ((e.key === "Tab" || e.key === "Enter") && suggestion()) {
            e.preventDefault();
            acceptSuggestion();
            submit();
        }
    };

    onMount(() => inputRefToFocus?.focus());

    return (
        <form onSubmit={submit}>
            <nav class="no-space medium-width center padding">
                <div class={"field max border small prefix round fill active " + styles["search-container"]}>
                    <i class="front">search</i>

                    <input class={styles["ghost-input"]}
                        tabindex={-1}
                        disabled
                        value={suggestion()}
                    />

                    <input class={styles["real-input"]}
                        type="search"
                        autocomplete="off"
                        placeholder="Enter an English word"
                        value={value()}
                        onInput={handleInput}
                        onKeyDown={handleKeyDown}
                        ref={inputRefToFocus}
                    />
                </div>
            </nav>
        </form >
    );
}
