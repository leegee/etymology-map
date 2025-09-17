from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
import re

# Load your fine-tuned LoRA model
tokenizer = AutoTokenizer.from_pretrained("./etymology-lora")
model = AutoModelForSeq2SeqLM.from_pretrained("./etymology-lora")

# -----------------------------
# 1. Function to split long entries
# -----------------------------
def chunk_entry(entry_text, max_chunk_len=150):
    """
    Split dictionary entry into smaller chunks.
    - Splits by commas, semicolons, or 'from' keywords.
    - Ensures chunk token length is below max_chunk_len.
    """
    # Split by commas or semicolons
    parts = re.split(r',|;', entry_text)
    chunks = []
    current_chunk = ""
    
    for part in parts:
        candidate = current_chunk + (", " if current_chunk else "") + part.strip()
        if len(tokenizer(candidate)["input_ids"]) <= max_chunk_len:
            current_chunk = candidate
        else:
            if current_chunk:
                chunks.append(current_chunk.strip())
            current_chunk = part.strip()
    if current_chunk:
        chunks.append(current_chunk.strip())
    return chunks

# -----------------------------
# 2. Run model on each chunk
# -----------------------------
def extract_etymology(entry_text):
    chunks = chunk_entry(entry_text)
    chain_parts = []
    
    for chunk in chunks:
        prompt = f"Return a concise chronological chain of origin. Use only information present in the input. Do not add extra words: {chunk}"
        inputs = tokenizer(prompt, return_tensors="pt")
        outputs = model.generate(**inputs, max_length=128)
        chunk_output = tokenizer.decode(outputs[0], skip_special_tokens=True).strip()
        chain_parts.append(chunk_output)
    
    # Merge the outputs using '<'
    full_chain = " < ".join(chain_parts)
    return full_chain


