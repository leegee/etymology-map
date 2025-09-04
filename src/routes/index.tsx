import "./index.css";
import "beercss/dist/cdn/beer.min.js";
import { createSignal, createMemo, createEffect } from "solid-js";
import WordSearch from "~/components/WordSearch";
import { Translation, SubjectDefinition } from "~/types";
import { WordsResponse } from "./api/words";
import TranslationMap from "~/components/TranslationMap";
import TimeSlider from "~/components/TimeSlider";

export default function Home() {
  const [translations, setTranslations] = createSignal<Translation[]>([]);
  const [subject, setSubject] = createSignal<SubjectDefinition[]>([]);
  const [dateRange, setDateRange] = createSignal<[number, number]>([100, new Date().getFullYear()]);

  const handleSearch = async (word: string) => {
    const res = await fetch(`/api/words?word=${encodeURIComponent(word)}`);
    if (!res.ok) return;
    const data = (await res.json()) as WordsResponse;
    setTranslations(data.translations as Translation[]);
    setSubject(data.subject as SubjectDefinition[]);
  };


  const filteredTranslations = createMemo(() =>
    translations().filter(t => {
      const start = Number(t.year_start) || 0;
      const end = Number(t.year_end) || 9999;
      const [min, max] = dateRange();
      return start <= max && end >= min;
    })
  );


  createEffect(() => {
    console.log("dateRange", dateRange());
    console.log("raw subjects", subject());
    console.log("raw translations", translations());
    console.log("filtered translations", filteredTranslations());
  });

  return (
    <>
      <nav class="bottom">
        <WordSearch onSearch={handleSearch} />

        <TimeSlider
          min={300}
          max={new Date().getFullYear()}
          value={dateRange()}
          onChange={setDateRange}
        />
      </nav>

      <main class="responsive">
        <TranslationMap
          subject={subject()}
          translations={filteredTranslations()}
        />
      </main>
    </>
  );
}
