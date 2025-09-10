from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
import torch

tokenizer = AutoTokenizer.from_pretrained("./etymology-lora")
model = AutoModelForSeq2SeqLM.from_pretrained("./etymology-lora")

# Example input
text = "Extract etymology from: Word: orange. Definition: A citrus fruit."
inputs = tokenizer(text, return_tensors="pt")
outputs = model.generate(**inputs, max_length=64)
print(tokenizer.decode(outputs[0], skip_special_tokens=True))
