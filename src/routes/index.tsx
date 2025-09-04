import { createSignal } from "solid-js";
import WordSearch from "~/components/WordSearch";
import TranslationList from "~/components/TranslationList";
import "./index.css";

type Translation = { word: string; lang: string };

export default function Home() {
  const [translations, setTranslations] = createSignal<Translation[]>([]);

  const handleSearch = async (word: string) => {
    const res = await fetch(`/api/words?word=${encodeURIComponent(word)}`);
    if (!res.ok) return;
    const data: Translation[] = await res.json();
    setTranslations(data);
  };

  return (
    <main class="responsive">
      <h1>Germanic Etymology Map</h1>
      <WordSearch onSearch={handleSearch} />
      <TranslationList translations={translations()} />
    </main>
  );
}
