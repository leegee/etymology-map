import "./index.css";
import "beercss/dist/cdn/beer.min.js";
import { createSignal, createMemo, createEffect } from "solid-js";
import WordSearch from "~/components/WordSearch";
import { Translation, SubjectDefinition } from "~/types";
import { WordsResponse } from "./api/words";
import TranslationMap from "~/components/TranslationMap";
import CenturySlider from "~/components/CenturySlider";
import AllCenturiesToggle from "~/components/AllCenturiesToggle";

export default function Home() {
  const [translations, setTranslations] = createSignal<Translation[]>([]);
  const [subject, setSubject] = createSignal<SubjectDefinition[]>([]);
  const [showAll, setShowAll] = createSignal(false);

  const currentYear = new Date().getFullYear();

  const availableYears = createMemo(() => {
    const set = new Set<number>();
    translations().forEach(t => {
      const start = Number(t.year_start) || 0;
      let end = Number(t.year_end) || 9999;
      if (end === 9999) end = currentYear;

      for (let y = start; y <= end; y += 100) set.add(y);
    });
    return Array.from(set).sort((a, b) => a - b);
  });

  const [sliderIndex, setSliderIndex] = createSignal(0);

  const dateRange = createMemo(() => {
    if (showAll()) return [0, currentYear];
    const year = availableYears()[sliderIndex()] || 0;
    return [year, year];
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
      let end = Number(t.year_end) || 9999;
      if (end === 9999) end = currentYear;
      const [min, max] = dateRange();
      return start <= max && end >= min;
    })
  );

  createEffect(() => {
    console.log("dateRange", dateRange());
    console.log("showAll", showAll());
    console.log("filtered translations", filteredTranslations());
  });

  return (
    <>
      <nav class="bottom">
        <WordSearch onSearch={handleSearch} />

        <AllCenturiesToggle
          value={showAll()}
          onChange={setShowAll}
        />

        <CenturySlider
          disabled={showAll()}
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
