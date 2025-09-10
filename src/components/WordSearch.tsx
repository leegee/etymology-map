import { createSignal, onMount, Show } from "solid-js";
import styles from './WordSearch.module.css';

type Props = {
    onSearch: (word: string) => void;
    fetchSuggestions: (query: string) => Promise<string[]>;
};

export default function WordSearch(props: Props) {
    let inputRef: HTMLInputElement | undefined;
    const [value, setValue] = createSignal("");
    const [suggestion, setSuggestion] = createSignal("");
    const [hasSuggestions, setHasSuggestions] = createSignal(false);

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
            setHasSuggestions(results.length > 0);

            if (results.length > 0 && results[0].toLowerCase().startsWith(val.toLowerCase())) {
                setSuggestion(results[0]);
            } else {
                setSuggestion("");
            }
        } else {
            setSuggestion("");
            setHasSuggestions(false);
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

    onMount(() => inputRef?.focus());

    return (
        <form onSubmit={submit}>
            <nav class="no-space medium-width center padding">
                <div class={"field max border small prefix round fill active " + styles["search-container"]}>
                    <i class="front">search</i>
                    <input
                        name="ghost-input"
                        class={`${styles["ghost-input"]}`}
                        tabindex={-1}
                        disabled
                        value={suggestion()}
                    />
                    <input
                        name="real-input"
                        class={`${styles["real-input"]} ${value() && !hasSuggestions() ? styles["no-suggestion"] : ""}`}
                        type="search"
                        autocomplete="off"
                        placeholder="Enter an English word"
                        value={value()}
                        onInput={handleInput}
                        onKeyDown={handleKeyDown}
                        ref={inputRef}
                    />
                    <Show when={value() && !hasSuggestions()}>
                        <div class="helper">That word is not in the database.</div>
                    </Show>
                </div>
            </nav>
        </form>
    );
}
