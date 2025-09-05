import { createSignal, createEffect } from "solid-js";

type Props = {
    disabled: boolean;
    years: number[];          // sorted array of years/centuries with data
    value: number;            // index into `years`
    onChange: (val: number) => void;
};

export default function CenturySlider(props: Props) {
    const handleSliderChange = (e: Event) => {
        const value = +(e.currentTarget as HTMLInputElement).value;
        props.onChange(value);
    };

    const changeValue = (v: number) => {
        const newValue = Number(props.value) + v;
        if (newValue >= 0 && newValue < props.years.length) props.onChange(newValue);
    }

    return (
        <div class="row middle">

            <button class="secondary small circle no-padding" onClick={() => changeValue(-1)}>
                <i>arrow_back</i>
                <div class="tooltip">Retreat in time</div>
            </button>

            <div class="row">
                <label class="slider medium">
                    <input
                        disabled={props.disabled}
                        type="range"
                        min={0}
                        max={props.years.length - 1}
                        step={1}
                        value={props.value}
                        onInput={handleSliderChange}
                    />
                    <span>
                        <i>calendar_month</i>
                    </span>
                </label>
                {/* <span class="helper">Zoom {props.years[props.value]}</span> */}
            </div>

            <button class="secondary small circle no-padding" onClick={() => changeValue(1)}>
                <i>arrow_forward</i>
                <div class="tooltip">Advance in time</div>
            </button>

            <div class="tooltip">Time period
                <br />
                {props.years[props.value]} {(props.years[props.value] >= 0 ? 'AD' : 'BC')}</div>
        </div>
    );
}


