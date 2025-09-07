import type { APIEvent } from "@solidjs/start/server";
import type { Translation, SubjectDefinition } from "~/types";
import { httpLogger } from "~/logger";
import { stmtFindExact, stmtFindPrefix, stmtFindTranslations } from "~/db";

export type WordsResponse = {
    subject: SubjectDefinition[];
    translations: Translation[];
};

export async function GET(event: APIEvent): Promise<Response> {
    const url = new URL(event.request.url);
    const q = (url.searchParams.get("word") ?? "").trim();

    // Exact match first
    let subject = stmtFindExact.all(q) as SubjectDefinition[];

    // Fallback to prefix search
    if (subject.length === 0) {
        subject = stmtFindPrefix.all(`${q}%`) as SubjectDefinition[];
    }

    // Look up translations for each word
    const translations: Translation[] = subject.flatMap((w) =>
        stmtFindTranslations.all(w.id) as Translation[]
    );

    httpLogger.debug({
        word: q,
        subjectCount: subject.length,
        translationCount: translations.length,
        subject,
        translations: translations,
    });

    const response: WordsResponse = { subject, translations };

    return new Response(JSON.stringify(response), {
        headers: { "Content-Type": "application/json" },
    });
}
