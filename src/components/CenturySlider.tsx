import { yearLabel } from "../lib/year-label";

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
        <fieldset class="row tiny-padding small-round">

            <button
                disabled={props.disabled}
                class="secondary small circle no-padding"
                onClick={() => changeValue(-1)}
            >
                <i>arrow_back</i>
                <div class="tooltip">{yearLabel(props.years[0])}</div>
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

            <button
                disabled={props.disabled}
                class="secondary small circle no-padding"
                onClick={() => changeValue(1)}
            >
                <i>arrow_forward</i>
                <div class="tooltip">{yearLabel(props.years[props.years.length - 1])}</div>
            </button>

            <div class="tooltip">
                {yearLabel(props.years[props.value])}
            </div>
        </fieldset>
    );
}


