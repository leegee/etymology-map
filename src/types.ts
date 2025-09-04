export type WordRow = {
    id: number;
    word: string;
    lang: string;
    pos?: string;
    etymology?: string;
    year_start?: number | null;
    year_end?: number | null;
};

export type Translation = {
    id: number;
    word_id: number;
    translation: string;
    lang: string;
    year_start?: number;
    year_end?: number;
};
