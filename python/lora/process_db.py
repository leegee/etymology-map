import sqlite3
from extract_etymology import extract_etymology

DB_FILE = "../public/data/words.db"

def truncate_text(text, max_len=150):
    """Truncate long text for console display with ellipsis."""
    if not text:
        return ""
    return text[:max_len] + ("..." if len(text) > max_len else "")

def process_words_console(batch_size=1000):
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()

    cursor.execute("SELECT id, word, etymology FROM words WHERE etymology IS NOT NULL AND word = 'cat'")
    entries = cursor.fetchall()  

    total = len(entries)
    print(f"Processing {total} entries (console output only)...\n")

    for idx, (word_id, word, etymology_text) in enumerate(entries, start=1):
        full_chain = extract_etymology(etymology_text)

        print(f"Entry #{idx}")
        print(f"  ID                       : {word_id}")
        print(f"  WORD                     : {word}")
        print(f"  ORIGINAL ETYMOLOGY       : {etymology_text}")
        print(f"  EXTRACTED ETYMOLOGY CHAIN: {full_chain}\n")
        print("-" * 80)

        if idx % batch_size == 0:
            print(f"Processed {idx}/{total} words...\n")

    conn.close()
    print("Processing complete.")

if __name__ == "__main__":
    process_words_console(batch_size=1000)
