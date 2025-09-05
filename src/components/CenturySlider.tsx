import { createSignal, createEffect } from "solid-js";

type Props = {
    disabled: boolean;
    years: number[];          // sorted array of years/centuries with data
    value: number;            // index into `years`
    onChange: (val: number) => void;
};

export default function CenturySlider(props: Props) {
    const [index, setIndex] = createSignal(props.value);

    createEffect(() => setIndex(props.value));

    const handleInput = (e: Event) => {
        const value = +(e.currentTarget as HTMLInputElement).value;
        setIndex(value);
        props.onChange(value);
    };

    return (
        <div class="field">
            <label class="slider medium">
                <input
                    disabled={props.disabled}
                    type="range"
                    min={0}
                    max={props.years.length - 1}
                    step={1}
                    value={index()}
                    onInput={handleInput}
                />
                <span>
                    <i>calendar_month</i>
                </span>
            </label>
            <span class="helper">Century {props.years[index()]}</span>
        </div>
    );
}
