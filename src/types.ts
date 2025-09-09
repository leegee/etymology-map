export type SubjectDefinition = {
    id: number;
    word: string;
    lang: string;
    pos?: string;
    etymology?: string;
    year_start?: number | null;
    year_end?: number | null;
};

export type WorldLink = {
    id: number;
    word_id: number;
    linked_word: string;
    lang: string;
    year_start?: number;
    year_end?: number;
};
