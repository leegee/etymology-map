type Translation = {
    word: string;
    lang: string;
};

type Props = {
    translations: Translation[];
};

export default function TranslationList(props: Props) {
    return (
        <ul>
            {props.translations.map(tr => (
                <li>
                    {tr.lang}: {tr.word}
                </li>
            ))}
        </ul>
    );
}
