import "./index.css";
import "beercss/dist/cdn/beer.min.js";
import { createSignal, createMemo, createEffect } from "solid-js";
import WordSearch from "~/components/WordSearch";
import { Translation, SubjectDefinition } from "~/types";
import { WordsResponse } from "./api/words";
import TranslationMap from "~/components/TranslationMap";
import CenturySlider from "~/components/CenturySlider";
import AllCenturiesToggle from "~/components/AllCenturiesToggle";
import { normaliseSubjects, normalizeWords } from "~/lib/normalizeWords";
import ZoomLevel from "~/components/ZoomLevel";
import { fetchJSON, pathForhWord, STATIC_BASE } from "~/lib/fetch";
import { getLanguage } from "~/lib/langs";

export default function Home() {
  const [translations, setTranslations] = createSignal<Translation[]>([]);
  const [subject, setSubject] = createSignal<SubjectDefinition[]>([]);
  const [showAll, setShowAll] = createSignal(true);
  const [zoomLevel, setZoomLevel] = createSignal(0.75);

  const currentYear = new Date().getFullYear();

  const availableYears = createMemo(() => {
    const set = new Set<number>();
    const currentYear = new Date().getFullYear();

    translations().forEach(t => {
      const start = Number(t.year_start) ?? 0;
      let end = Number(t.year_end) ?? currentYear;

      const startCentury = Math.floor(start / 100) * 100;
      const endCentury = Math.floor(end / 100) * 100;

      set.add(startCentury);
      set.add(endCentury);
    });

    const rv = Array.from(set).sort((a, b) => a - b);
    // console.log('Years available', rv)
    return rv;
  });

  const [sliderIndex, setSliderIndex] = createSignal(0);

  const dateRange = createMemo(() => {
    if (showAll()) return [0, currentYear];
    const year = availableYears()[sliderIndex()] || 0;
    return [year, year];
  });

  const handleSearch = async (word: string) => {
    const data = await fetchJSON<WordsResponse>("/api/words?word=" + encodeURIComponent(word));

    const translations = normalizeWords(data.translations);
    const subjects = normaliseSubjects(data.subject);

    console.log(subjects)

    setSubject(subjects);
    setTranslations(translations);
  };

  const filteredTranslations = createMemo(() =>
    translations().filter(t => {
      const start = Number(t.year_start) || 0;
      let end = Number(t.year_end) || currentYear;
      const [min, max] = dateRange();
      return start <= max && end >= min;
    })
  );

  // createEffect(() => {
  //   console.log("dateRange", dateRange());
  //   console.log("showAll", showAll());
  //   console.log("filtered translations", filteredTranslations());
  // });

  return (
    <>
      <nav class="bottom">
        <ZoomLevel
          disabled={!subject().length}
          value={zoomLevel()}
          onChange={(real: number) => setZoomLevel(real)}
        />

        <WordSearch onSearch={handleSearch} />

        <AllCenturiesToggle
          disabled={!subject().length}
          value={showAll()}
          onChange={setShowAll}
        />

        <CenturySlider
          disabled={showAll() || !subject().length}
          years={availableYears()}
          value={sliderIndex()}
          onChange={setSliderIndex}
        />
      </nav>

      {/* <main class="responsive"> */}
      <main>
        <TranslationMap
          subject={subject()}
          translations={filteredTranslations()}
          zoom={zoomLevel()}
        />
      </main>
    </>
  );
}
