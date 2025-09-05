import { Component } from "solid-js";

type Props = {
    value: boolean;
    onChange: (val: boolean) => void;
    label?: string;
    disabled?: boolean;
};

const AllCenturiesToggle: Component<Props> = (props) => {
    return (
        <div class="field small-padding top-padding">
            <label class="switch icon">
                <input
                    disabled={props.disabled}
                    type="checkbox"
                    checked={props.value}
                    onChange={e => props.onChange(e.currentTarget.checked)}
                />
                <span>
                    <i>all_inclusive</i>
                </span>
            </label>
            <span class="helper">All</span>
        </div>
    );
};

export default AllCenturiesToggle;
