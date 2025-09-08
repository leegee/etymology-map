import { createSignal, createMemo } from "solid-js";
import { Translation, SubjectDefinition } from "./types";
import WordSearch from "./components/WordSearch";
import TranslationMap from "./components/Map";
import CenturySlider from "./components/CenturySlider";
import AllCenturiesToggle from "./components/AllCenturiesToggle";
import ZoomLevel from "./components/ZoomLevel";
import { fetchWords } from "./lib/fetch";
import { Portal } from "solid-js/web";

export default function App() {
  const [translations, setTranslations] = createSignal<Translation[]>([]);
  const [subject, setSubject] = createSignal<SubjectDefinition[]>([]);
  const [showAll, setShowAll] = createSignal(true);
  const [zoomLevel, setZoomLevel] = createSignal(0.75);
  const [searchTerm, setSearchTerm] = createSignal('');

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

  const handleSearch = async (q: string) => {
    setSearchTerm(q);
    const data = await fetchWords(q);

    if (data.translations.length === 0) {
      ui("#snackbar");
      setTimeout(() => ui("#snackbar", 0), 2000);
    }

    setSubject(data.subject);
    setTranslations(data.translations);
  };

  const filteredTranslations = createMemo(() =>
    translations().filter(t => {
      const start = Number(t.year_start) || 0;
      let end = Number(t.year_end) || currentYear;
      const [min, max] = dateRange();
      return start <= max && end >= min;
    })
  );

  return (
    <>
      <Portal mount={document.body}>
        <div class="snackbar error center-align" id="snackbar">The word "{searchTerm()}" is not in the list supported by this version.</div>
      </Portal>

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

      <main class="responsive no-padding max">
        <TranslationMap
          subject={subject()}
          translations={filteredTranslations()}
          zoom={zoomLevel()}
        />
      </main>
    </>
  );
}
