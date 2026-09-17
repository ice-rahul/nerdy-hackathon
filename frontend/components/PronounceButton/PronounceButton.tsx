"use client";

import { speak, speakWithPause } from "@/lib/feedback/speech";

// Pronounces a single target-language word aloud — separate from the
// mascot's own guidance voice (guidanceCopy.ts), since this always speaks
// the language being learned, never the learner's native language.
export function PronounceButton({
  text,
  lang,
  blankMarker,
}: {
  text: string;
  lang: string;
  // Fill-in-the-blank text contains a literal placeholder (e.g. "_____")
  // that shouldn't be read aloud — pass the marker so it's spoken as a
  // pause between the surrounding segments instead.
  blankMarker?: string;
}) {
  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        if (blankMarker && text.includes(blankMarker)) {
          speakWithPause(text, blankMarker, lang);
        } else {
          speak(text, lang);
        }
      }}
      aria-label={`Hear "${text}" pronounced`}
      title="Listen"
      className=" absolute top-4 right-4 cursor-pointer flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-4 border-ink bg-explorer text-xs text-white shadow-sticker-sm transition-transform hover:-translate-y-0.5"
    >
      🔊
    </button>
  );
}
