import jsonlines
from tqdm import tqdm
import ollama

# ----------------------------
# 1. Input / output files
# ----------------------------
input_file = "wikidata.jsonl"
output_file = "etymology_results.jsonl"

# ----------------------------
# 2. Few-shot examples (minimal, chain-only)
# ----------------------------
few_shot = """
Extract only etymology chains. 
Output exactly one line per word.
Format: Word < Source1 < Source2 < ... < LastSource
Do NOT include definitions, explanations, or labels like "Word:" or "Source1:".
Line i must correspond to word i in the batch.

Example 1:
Definition: A tropical fruit from Africa.
banana < Wolof 'banana'

Example 2:
Definition: A month of the year.
April < Middle English 'apprille' < Old French avrill < Latin Aprilis

Example 3:
Definition: An domesticated feline/
cat < Old English catt < Proto-West Germanic *kattu < Proto-Germanic *kattuz < Late Latin cattus
"""

# ----------------------------
# 3. Settings
# ----------------------------
BATCH_SIZE = 10
MODEL = "phi3"

# ----------------------------
# 4. Build batch prompt
# ----------------------------
def build_batch_prompt(entries):
    prompt = few_shot + "\n\n"
    for entry in entries:
        word = entry.get("word", "").strip()
        if word:
            prompt += f"{word}\nEtymology:\n"
    return prompt

# ----------------------------
# 5. Process JSONL in batches
# ----------------------------
with jsonlines.open(input_file, mode='r') as reader, \
     jsonlines.open(output_file, mode='w') as writer:

    batch = []
    for entry in tqdm(reader, desc="Reading entries"):
        batch.append(entry)

        if len(batch) >= BATCH_SIZE:
            prompt = build_batch_prompt(batch)
            try:
                response = ollama.generate(model=MODEL, prompt=prompt)
                raw_output = response.get("response", "").split("\n")

                for i, e in enumerate(batch):
                    line = raw_output[i].strip() if i < len(raw_output) else ""
                    # Ensure we start from the word itself
                    if "<" in line:
                        idx = line.find("<")
                        etym = line[:idx].strip() + " " + line[idx:].strip()
                    else:
                        etym = line
                    writer.write({"word": e["word"], "etymology": etym})

            except Exception as ex:
                print(f"Batch error: {ex}")

            batch = []

    # Process remaining entries
    if batch:
        prompt = build_batch_prompt(batch)
        try:
            response = ollama.generate(model=MODEL, prompt=prompt)
            raw_output = response.get("response", "").split("\n")
            for i, e in enumerate(batch):
                line = raw_output[i].strip() if i < len(raw_output) else ""
                if "<" in line:
                    idx = line.find("<")
                    etym = line[:idx].strip() + " " + line[idx:].strip()
                else:
                    etym = line
                writer.write({"word": e["word"], "etymology": etym})
        except Exception as ex:
            print(f"Final batch error: {ex}")
