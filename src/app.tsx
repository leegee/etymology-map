import { createSignal, createMemo, onMount, Show } from "solid-js";
import type { WorldLink, SubjectDefinition } from "./types";
import WordSearch from "./components/WordSearch";
import GeoMap from "./components/Map";
import CenturySlider from "./components/CenturySlider";
import AllCenturiesToggle from "./components/AllCenturiesToggle";
import ZoomLevel from "./components/ZoomLevel";
import { fetchAutocompleteWords, fetchWords } from "./lib/fetch";
import { Portal } from "solid-js/web";

const GOOGLE_10K = true;

export default function App() {
  const [wordLinks, setwordLinks] = createSignal<WorldLink[]>([]);
  const [subject, setSubject] = createSignal<SubjectDefinition[]>([]);
  const [showAll, setShowAll] = createSignal(true);
  const [zoomLevel, setZoomLevel] = createSignal(0.75);
  const [sliderIndex, setSliderIndex] = createSignal(0);
  const [searchTerm, setSearchTerm] = createSignal('');

  const currentYear = new Date().getFullYear();

  // createEffect(() => {
  //   console.log('years', availableYears());
  //   console.log('links', wordLinks());
  // });

  const availableYears = createMemo(() => {
    const set = new Set<number>();

    wordLinks().forEach(t => {
      const start = Number(t.year_start);
      let end = Number(t.year_end);

      const startCentury = Math.floor(start / 100) * 100;
      const endCentury = Math.floor(end / 100) * 100;

      set.add(startCentury);
      set.add(endCentury);
    });

    const rv = Array.from(set).sort((a, b) => a - b);
    return rv;
  });


  const dateRange = createMemo(() => {
    if (showAll()) return [-9999, currentYear];
    const year = availableYears()[sliderIndex()] || 0;
    return [year, year];
  });


  const filteredwordLinks = createMemo(() => {
    if (showAll()) return wordLinks();
    const [year] = dateRange();
    const centuryStart = year;
    const centuryEnd = year + 99;
    const rv = wordLinks().filter(t => {
      const start = Number(t.year_start);
      const end = Number(t.year_end);
      return start <= centuryEnd && end >= centuryStart;
    });
    return rv;
  });


  const handleSearch = async (q: string) => {
    ui("#welcome-snackbar", 0);
    ui("#error-snackbar", 0);
    setSearchTerm(q);
    const data = await fetchWords(q);

    if (data.wordLinks.length === 0) {
      ui("#error-snackbar");
      setTimeout(() => ui("#error-snackbar", 0), 2_000);
    }

    setSubject(data.subject);
    setwordLinks(data.wordLinks);
  };

  onMount(() => {
    ui("#welcome-snackbar");
    setTimeout(() => ui("#welcome-snackbar", 0), 10_000);
  });

  return (
    <>
      <Portal mount={document.body}>
        <div id="welcome-snackbar" class="snackbar primary max center-align">
          <div class="max">Enter a word for which to search; click a word for more details. Toggle 'all' to use the time slider.</div>
          <a class="inverse-link"><i>close</i></a>
        </div>

        <div id="error-snackbar" class="snackbar error max center-align">
          The word "{searchTerm()}" is not in the list supported by this version
          <Show when={GOOGLE_10K}>
            which only supports <a href="https://github.com/first20hours/google-10000-english/blob/master/google-10000-english.txt" target="_blank">Google's top 10,000 words</a>.
          </Show>
        </div>
      </Portal>

      <nav class="bottom">
        <ZoomLevel
          disabled={!subject().length}
          value={zoomLevel()}
          onChange={(real: number) => setZoomLevel(real)}
        />

        <WordSearch onSearch={handleSearch} fetchSuggestions={fetchAutocompleteWords} />

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
        <GeoMap
          subject={subject()}
          wordLinks={filteredwordLinks()}
          zoom={zoomLevel()}
        />
      </main>
    </>
  );
}
