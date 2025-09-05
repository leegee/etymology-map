import { Component } from "solid-js";

type Props = {
    value: number;
    disabled: boolean;
    onChange: (val: number) => void;
};

const ZoomLevel: Component<Props> = (props) => {
    return (
        <div class="field">
            <label class="slider medium">
                <input
                    name="zoom"
                    disabled={props.disabled}
                    type="range"
                    min="0.3"
                    max="1"
                    step="0.1"
                    value={String(props.value)}
                    onInput={(e) => props.onChange(Number((e.target as HTMLInputElement).value))}
                />
                <span>
                    <i>zoom_out</i>
                </span>
                <div class="tooltip"></div>
            </label>
            <span class="helper">Marker size</span>
        </div>
    );
};

export default ZoomLevel;
