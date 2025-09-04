export type WordRow = {
    id: number;
    word: string;
    lang: string;
    pos?: string;
    etymology?: string;
    year_start?: number | null;
    year_end?: number | null;
};

export type TranslationRow = {
    word_id: number;
} & Translation;

export type Translation = {
    translation: string;
    lang: string;
};
