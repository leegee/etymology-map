import { createSignal, createEffect } from "solid-js";

type Props = {
    years: number[];          // sorted array of years/centuries with data
    value: number;            // index into `years`
    onChange: (val: number) => void;
};

export default function CenturySlider(props: Props) {
    const [index, setIndex] = createSignal(props.value);

    // sync local state with parent
    createEffect(() => setIndex(props.value));

    const handleInput = (e: Event) => {
        const value = +(e.currentTarget as HTMLInputElement).value;
        setIndex(value);
        props.onChange(value);
    };

    return (
        <div class="">
            <label class="slider small medium">
                <input
                    type="range"
                    min={0}
                    max={props.years.length - 1}
                    step={1}
                    value={index()}
                    onInput={handleInput}
                />
                <div class="tooltip">{props.years[index()]}</div>
            </label>
        </div>
    );
}
