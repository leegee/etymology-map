import "./index.css";
import { createSignal } from "solid-js";
import WordSearch from "~/components/WordSearch";
import { Translation, SubjectDefinition } from "~/types";
// import TranslationList from "~/components/TranslationList";
import TranslationMap from "~/components/TranslationMap";

export default function Home() {
  const [translations, setTranslations] = createSignal<Translation[]>([]);
  const [subject, setSubject] = createSignal<SubjectDefinition[]>([]);

  const handleSearch = async (word: string) => {
    const res = await fetch(`/api/words?word=${encodeURIComponent(word)}`);
    if (!res.ok) return;
    const data = await res.json();
    setTranslations(data.translations as Translation[]);
    setSubject(data.subject as SubjectDefinition[]);
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
        <TranslationMap subject={subject()} translations={translations()} />
      </main>
    </>
  );
}
