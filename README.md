# Etymology Map

Currently maps Germanic roots of English words

wip

## Use

    mkdir data
    curl -L -o data/raw-wiktextract-data.jsonl \
        https://huggingface.co/datasets/aletrn/wiktionary/resolve/main/raw-wiktextract-data.jsonl

    bun db:build

    Total words inserted: 5300
    Total translations inserted: 31629
    Skipped empty translations: 772
    Skipped non-Germanic translations or words: 1656820

    bun db:see craft
    # Should output json for 'craft'

    bun dev

    bun build
    bun deploy

## To Do

* If no exact match is found, prefix search may return a list - allow the user to select from that
* Expand to Latinate and other words

## Credit

https://huggingface.co/datasets/aletrn/wiktionary/blob/main/raw-wiktextract-data.jsonl
