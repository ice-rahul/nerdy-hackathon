"""
One-time asset-generation script for Exercise 1's scene objects.

Calls Hugging Face's free Inference API to produce a small, visually cohesive
PNG set. Run manually from /backend:

    ./venv/bin/python scripts/generate_exercise1_assets.py

This is a build-time tool, not something the running app calls — the app just
serves the resulting static PNGs from /frontend/public/images/exercise1/.
"""

import os
import sys
import time

from dotenv import load_dotenv
from huggingface_hub import InferenceClient
from huggingface_hub.errors import HfHubHTTPError
from rembg import remove as remove_background

load_dotenv()

OUTPUT_DIR = os.path.join(
    os.path.dirname(__file__), "..", "..", "frontend", "public", "images", "exercise1"
)

MODEL = "black-forest-labs/FLUX.1-schnell"

# The model can't output a real alpha channel, so it's prompted against a plain
# white background and rembg cuts that out afterward into a transparent PNG —
# scenes composite objects on top of a background image, so a visible white box
# around each sticker isn't acceptable.
STYLE_SUFFIX = (
    "flat vector illustration sticker, bold clean outlines, bright colors, "
    "plain white background, no text, no watermark, single object, centered, "
    "isolated, simple children's-book icon style"
)

OBJECTS = [
    {"id": "apple", "en": "apple", "es": "manzana"},
    {"id": "banana", "en": "banana", "es": "plátano"},
    {"id": "milk", "en": "milk", "es": "leche"},
    {"id": "bread", "en": "bread", "es": "pan"},
    {"id": "cheese", "en": "cheese", "es": "queso"},
    {"id": "bed", "en": "bed", "es": "cama"},
    {"id": "lamp", "en": "lamp", "es": "lámpara"},
    {"id": "window", "en": "window", "es": "ventana"},
    {"id": "chair", "en": "chair", "es": "silla"},
    {"id": "book", "en": "book", "es": "libro"},
    {"id": "toothbrush", "en": "toothbrush", "es": "cepillo de dientes"},
    {"id": "soap", "en": "soap", "es": "jabón"},
    {"id": "towel", "en": "towel", "es": "toalla"},
    {"id": "mirror", "en": "mirror", "es": "espejo"},
    {"id": "shower", "en": "shower", "es": "ducha"},
    {"id": "pencil", "en": "pencil", "es": "lápiz"},
    {"id": "notebook", "en": "notebook", "es": "cuaderno"},
    {"id": "backpack", "en": "backpack", "es": "mochila"},
    {"id": "desk", "en": "desk", "es": "escritorio"},
    {"id": "scissors", "en": "scissors", "es": "tijeras"},
]

MIN_DIMENSION = 256
MAX_RETRIES = 5
RETRY_DELAY_SECONDS = 20  # model cold-start can take ~20-30s to load


def build_prompt(en_label: str) -> str:
    return f"A single {en_label}, {STYLE_SUFFIX}"


def generate_one(client: InferenceClient, prompt: str):
    last_error = None
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            return client.text_to_image(prompt, model=MODEL)
        except HfHubHTTPError as e:
            last_error = e
            # 503 = model loading (cold start); anything else, don't bother retrying
            status = getattr(e.response, "status_code", None)
            if status != 503 or attempt == MAX_RETRIES:
                raise
            print(f"    model loading, retrying in {RETRY_DELAY_SECONDS}s (attempt {attempt}/{MAX_RETRIES})...")
            time.sleep(RETRY_DELAY_SECONDS)
    raise last_error


def main():
    token = os.getenv("HF_TOKEN")
    if not token:
        print("HF_TOKEN not set in backend/.env", file=sys.stderr)
        sys.exit(1)

    os.makedirs(OUTPUT_DIR, exist_ok=True)
    client = InferenceClient(token=token)

    # Skip objects that already have an image on disk — running this again
    # after adding new categories would otherwise waste time (and vary) the
    # existing set for no reason. Pass --force to regenerate everything.
    force = "--force" in sys.argv
    pending = OBJECTS if force else [
        obj for obj in OBJECTS if not os.path.exists(os.path.join(OUTPUT_DIR, f"{obj['id']}.png"))
    ]
    if not pending:
        print("All object images already exist — nothing to do (pass --force to regenerate).")
        return

    results = []
    for obj in pending:
        prompt = build_prompt(obj["en"])
        print(f"Generating {obj['id']}...")
        image = generate_one(client, prompt)

        cutout = remove_background(image)

        out_path = os.path.join(OUTPUT_DIR, f"{obj['id']}.png")
        cutout.save(out_path)

        width, height = cutout.size
        ok = width >= MIN_DIMENSION and height >= MIN_DIMENSION
        status = "OK" if ok else "TOO SMALL"
        print(f"  saved {out_path} ({width}x{height}) [{status}]")
        results.append({**obj, "width": width, "height": height, "ok": ok})

    failed = [r for r in results if not r["ok"]]
    if failed:
        print(f"\n{len(failed)} image(s) below {MIN_DIMENSION}x{MIN_DIMENSION}:", file=sys.stderr)
        for r in failed:
            print(f"  {r['id']}: {r['width']}x{r['height']}", file=sys.stderr)
        sys.exit(1)

    print(f"\nAll {len(results)} images generated successfully.")


if __name__ == "__main__":
    main()
