from transformers import AutoTokenizer, AutoModelForSeq2SeqLM, Trainer, TrainingArguments, DataCollatorForSeq2Seq
from datasets import load_dataset
from peft import LoraConfig, get_peft_model

# Load base model
model_name = "google/flan-t5-small"

tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModelForSeq2SeqLM.from_pretrained(model_name)

# Apply LoRA
lora_config = LoraConfig(
    r=4,                # rank
    lora_alpha=16,      # scaling
    target_modules=["q", "v"],  # T5 uses "q" and "v" projection layers
    lora_dropout=0.1,
    bias="none",
    task_type="SEQ_2_SEQ_LM"
)

model = get_peft_model(model, lora_config)

# Load dataset
dataset = load_dataset("json", data_files="etymology_data.jsonl")
train_dataset = dataset["train"]

# Tokenization function
def tokenize_fn(examples):
    model_inputs = tokenizer(
        examples["prompt"],
        max_length=128,
        truncation=True
    )
    labels = tokenizer(
        examples["completion"],
        max_length=64,
        truncation=True
    )
    model_inputs["labels"] = labels["input_ids"]
    return model_inputs

train_dataset = train_dataset.map(tokenize_fn, batched=False)

# Prepare trainer
data_collator = DataCollatorForSeq2Seq(tokenizer, model=model)

training_args = TrainingArguments(
    output_dir="./etymology-lora",
    per_device_train_batch_size=1,
    num_train_epochs=3,
    logging_steps=10,
    save_steps=50,
    save_total_limit=2,
    fp16=False,  # CPU only
    report_to=None
)

trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=train_dataset,
    tokenizer=tokenizer,
    data_collator=data_collator
)

# Start training
trainer.train()

# Save the LoRA adapters separately
model.save_pretrained("./etymology-lora")
tokenizer.save_pretrained("./etymology-lora")

print("Training complete!")
