import { createSignal, onMount } from "solid-js";

type Props = {
    onSearch: (word: string) => void;
};

export default function WordSearch(props: Props) {
    let inputRef: HTMLInputElement | undefined;
    const [value, setValue] = createSignal("");

    const submit = (e: Event) => {
        e.preventDefault();
        props.onSearch(value());
        inputRef?.focus(); // Re-focus after submit
    };

    onMount(() => inputRef?.focus());

    return (
        <form onSubmit={submit}>
            <nav class="no-space medium-width center padding">
                <div class="field max border left-round">
                    <input
                        name="search"
                        type="search"
                        placeholder="Enter English word..."
                        value={value()}
                        onInput={e => setValue((e.target as HTMLInputElement).value)}
                        ref={inputRef}
                    />
                </div>
                <button type="submit" class="large right-round">
                    <i>search</i>
                </button>
            </nav>
        </form>
    );
}
