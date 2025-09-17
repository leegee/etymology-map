# tune.py
import json
from datasets import load_dataset, Dataset
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM, Seq2SeqTrainer, Seq2SeqTrainingArguments, DataCollatorForSeq2Seq
from peft import get_peft_model, LoraConfig, TaskType
import shutil, os

# Config
base_model_name = "google/flan-t5-small"   # or "t5-base"
lora_path = "./etymology-lora"
train_file = "./etymology_data.jsonl"  # your dataset of entries
INSTRUCTION = "ONLY extract the etymology chain. STOP at the last historical ancestor. Ignore cognates, dates, and commentary; ignore cognates, historical spread, examples, commentary, or any additional information."

# Clear on-disk cache
cache_dir = os.path.expanduser("~/.cache/huggingface/datasets")
if os.path.exists(cache_dir):
    shutil.rmtree(cache_dir)

# 1. Load dataset fresh each run
def load_training_data():
    # HuggingFace datasets can read JSONL directly
    dataset = load_dataset("json", data_files={"train": train_file})
    return dataset

# 3. Train LoRA from scratch
def train():
    tokenizer = AutoTokenizer.from_pretrained(base_model_name)
    base_model = AutoModelForSeq2SeqLM.from_pretrained(base_model_name)

    dataset = load_training_data()

    def map_fn(batch):
        # Prepend instruction to each input
        inputs_with_instruction = [
            f"{INSTRUCTION} WORD: {w}, DEFINITION: {d}" 
            for w, d in zip(batch["word"], batch["definition"])
        ]
        
        model_inputs = tokenizer(
            inputs_with_instruction,
            max_length=512,   
            truncation=True
        )
        
        labels = tokenizer(
            batch["output"],
            max_length=128,
            truncation=True
        )
        
        model_inputs["labels"] = labels["input_ids"]
        return model_inputs

    tokenized_dataset = dataset["train"].map(map_fn, batched=True, remove_columns=dataset["train"].column_names)

    # LoRA config
    lora_config = LoraConfig(
        task_type=TaskType.SEQ_2_SEQ_LM,
        r=8,
        lora_alpha=16,
        lora_dropout=0.1
    )
    model = get_peft_model(base_model, lora_config)

    # Training args: overwrite every time
    training_args = Seq2SeqTrainingArguments(
        output_dir=lora_path,
        overwrite_output_dir=True,  
        per_device_train_batch_size=4,
        learning_rate=2e-4,
        num_train_epochs=3,
        weight_decay=0.01,
        save_strategy="epoch",
        save_total_limit=1,
        logging_dir="./logs",
        logging_steps=50,
        predict_with_generate=True,
        report_to="none"
    )

    data_collator = DataCollatorForSeq2Seq(tokenizer, model=model)

    trainer = Seq2SeqTrainer(
        model=model,
        args=training_args,
        train_dataset=tokenized_dataset,
        tokenizer=tokenizer,
        data_collator=data_collator
    )

    trainer.train()
    model.save_pretrained(lora_path)
    tokenizer.save_pretrained(lora_path)
    print(f"Training complete. LoRA adapter saved to {lora_path}")

if __name__ == "__main__":
    train()
