"""
One-time script to add French and German translations to Exercise 1's kitchen
scene object labels, extending each label from {es, en} to {es, en, fr, de}.
Run manually from /backend:

    ./venv/bin/python scripts/translate_exercise1_labels.py

Build-time tool only, not something the running app calls — one Claude API
call per language (two total), reusing the ```json prefill + stop_sequences
structured-output pattern from utils.py.
"""

import json
import os
import sys

from anthropic import Anthropic
from dotenv import load_dotenv

load_dotenv()

KITCHEN_JSON_PATH = os.path.join(
    os.path.dirname(__file__), "..", "..", "frontend", "lib", "scenes", "kitchen.json"
)

MODEL = "claude-haiku-4-5"

LANGUAGES = {"fr": "French", "de": "German"}


def translate_words(client, words, language_name):
    word_list = ", ".join(f'"{w}"' for w in words)

    prompt = f"""Translate each of these English household-object nouns into {language_name}.
Give the single most common, everyday {language_name} noun a beginner language
learner would use for each (no articles).

Words: {word_list}

Respond with a JSON object mapping each original English word to its
{language_name} translation, in this shape:
{{
  "apple": "...",
  "banana": "..."
}}"""

    messages = [
        {"role": "user", "content": prompt},
        {"role": "assistant", "content": "```json"},
    ]
    response = client.messages.create(
        model=MODEL,
        max_tokens=500,
        messages=messages,
        stop_sequences=["```"],
    )
    return json.loads(response.content[0].text)


def main():
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        print("ANTHROPIC_API_KEY not set in backend/.env", file=sys.stderr)
        sys.exit(1)

    with open(KITCHEN_JSON_PATH, encoding="utf-8") as f:
        scene = json.load(f)

    words = [obj["label"]["en"] for obj in scene]
    client = Anthropic(api_key=api_key)

    translations = {}
    for code, language_name in LANGUAGES.items():
        print(f"Translating to {language_name}...")
        translations[code] = translate_words(client, words, language_name)

    for obj in scene:
        en_word = obj["label"]["en"]
        for code in LANGUAGES:
            translated = translations[code].get(en_word)
            if not translated:
                print(f"WARNING: no {code} translation for '{en_word}'", file=sys.stderr)
                continue
            obj["label"][code] = translated
        print(f"  {en_word}: {obj['label']}")

    with open(KITCHEN_JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(scene, f, indent=2, ensure_ascii=False)
        f.write("\n")

    print(f"\nUpdated {KITCHEN_JSON_PATH}")


if __name__ == "__main__":
    main()
