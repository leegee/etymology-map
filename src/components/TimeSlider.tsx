import { createSignal, createEffect, onMount } from "solid-js";

type Props = {
    min: number;
    max: number;
    value: [number, number];
    onChange: (val: [number, number]) => void;
};

export default function TimeSlider(props: Props) {
    const [range, setRange] = createSignal<[number, number]>(props.value);

    // Keep local range in sync if parent changes
    createEffect(() => setRange(props.value));

    const handleInput = (e: Event, index: 0 | 1) => {
        const value = +(e.currentTarget as HTMLInputElement).value;
        const newRange: [number, number] = [...range()] as [number, number];
        newRange[index] = value;

        // prevent crossing
        if (newRange[0] > newRange[1]) newRange[index] = newRange[1 - index];

        setRange(newRange);
        props.onChange(newRange);
    };

    onMount(() => {
        // @ts-ignore
        if (window.Beer) window.Beer.slider(sliderRef); // initialize BeerCSS slider
    });

    return (
        <div class="">
            <label class="slider small medium">
                <input
                    type="range"
                    min={props.min}
                    max={props.max}
                    value={range()[0]}
                    onInput={e => handleInput(e, 0)}
                />
                <input
                    type="range"
                    min={props.min}
                    max={props.max}
                    value={range()[1]}
                    onInput={e => handleInput(e, 1)}
                />
                <span>
                    <i>calendar_month </i>
                </span>

                <div class="tooltip"></div>
                <div class="tooltip"></div>
            </label>
        </div>
    );
}
