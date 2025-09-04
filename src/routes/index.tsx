import "./index.css";
import { createSignal } from "solid-js";
import WordSearch from "~/components/WordSearch";
import TranslationList from "~/components/TranslationList";
import { Translation } from "~/types";
import Map from "~/components/TranslationMap";

export default function Home() {
  const [translations, setTranslations] = createSignal<Translation[]>([]);

  const handleSearch = async (word: string) => {
    const res = await fetch(`/api/words?word=${encodeURIComponent(word)}`);
    if (!res.ok) return;
    const data: Translation[] = await res.json();
    setTranslations(data);
  };

  return (
    <>
      <nav class="bottom">
        <WordSearch onSearch={handleSearch} />
        {/* <a>
          <i>home</i>
          <div>Home</div>
        </a>
        <a>
          <i>search</i>
          <div>Search</div>
        </a>
        <a>
          <i>share</i>
          <div>share</div>
        </a> */}
      </nav>

      <main class="responsive">
        {/* <TranslationList translations={translations()} /> */}
        <Map translations={translations()} />
      </main>
    </>
  );
}
