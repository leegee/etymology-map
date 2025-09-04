type Translation = {
    translation: string;
    lang: string;
};

type Props = {
    translations: Translation[];
};

export default function TranslationList(props: Props) {
    return (
        <div class="center padding medium-width">
            <h2>Results</h2>
            {props.translations.map(tr => (
                <div class="row" lang={tr.lang}>
                    <div class="card-subtitle">{tr.lang}</div>
                    <div class="card-text">{tr.translation}</div>
                </div>
            ))}
        </div>
    );
}
