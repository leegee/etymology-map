import { createSignal } from "solid-js";

type Props = {
    onSearch: (word: string) => void;
};

export default function WordSearch(props: Props) {
    const [value, setValue] = createSignal("");

    const submit = (e: Event) => {
        e.preventDefault();
        props.onSearch(value());
    };

    return (
        <form onSubmit={submit}>
            <nav class="no-space">
                <div class="field max border left-round">
                    <input
                        type="text"
                        placeholder="Enter English word..."
                        value={value()}
                        onInput={e => setValue((e.target as HTMLInputElement).value)}
                    />
                </div>
                <button type="submit" class="large right-round">Search</button>
            </nav>
        </form>
    );
}
