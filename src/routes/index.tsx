import "./index.css";
import "beercss/dist/cdn/beer.min.js";
import { createSignal, createMemo, createEffect } from "solid-js";
import WordSearch from "~/components/WordSearch";
import { Translation, SubjectDefinition } from "~/types";
import { WordsResponse } from "./api/words";
import TranslationMap from "~/components/TranslationMap";
import CenturySlider from "~/components/CenturySlider";

export default function Home() {
  const [translations, setTranslations] = createSignal<Translation[]>([]);
  const [subject, setSubject] = createSignal<SubjectDefinition[]>([]);

  // Compute unique centuries with data
  const availableYears = createMemo(() => {
    const set = new Set<number>();
    translations().forEach(t => {
      const start = Number(t.year_start) || 0;
      const end = Number(t.year_end) || 9999;
      for (let y = start; y <= end; y += 100) set.add(y); // step by century
    });
    return Array.from(set).sort((a, b) => a - b);
  });

  // Index into availableYears
  const [sliderIndex, setSliderIndex] = createSignal(0);

  // Convert slider index to single-year range for filtering
  const dateRange = createMemo(() => {
    const year = availableYears()[sliderIndex()] || 0;
    return [year, year]; // single century
  });

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

        <CenturySlider
          years={availableYears()}
          value={sliderIndex()}
          onChange={setSliderIndex}
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
