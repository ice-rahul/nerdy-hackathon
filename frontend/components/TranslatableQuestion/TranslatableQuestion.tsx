import { PronounceButton } from "@/components/PronounceButton/PronounceButton";

// A native <details>/<summary> disclosure: the question shows in the
// target language (the summary, always visible) and expanding it reveals
// the same question translated into the learner's preferred language (the
// details) — so a learner who doesn't yet understand the target-language
// wording can still check they understood the scenario, without the
// translation being visible by default and giving the answer away.
export function TranslatableQuestion({
  question,
  translation,
  lang,
  bare = false,
  summaryClassName = "font-body text-lg font-bold text-ink",
  minHeightClass = "min-h-28",
}: {
  question: string;
  translation: string;
  // BCP-47 speech code for the target language — when given, adds a
  // "listen" button that pronounces the question. Omit to render without
  // one (e.g. contexts where no target-language voice is known yet).
  lang?: string;
  // Skip the outer sticker-panel styling when this is nested inside a
  // panel that already provides it (Exercise 1's quiz card, which also
  // holds the object image) — otherwise every use gets its own panel.
  bare?: boolean;
  summaryClassName?: string;
  // Matches the StreamingText panel shown while this question was still
  // streaming in, so swapping from one to the other doesn't itself cause a
  // layout jump on top of whatever streaming already avoided.
  minHeightClass?: string;
}) {
  return (
    // Keyed on the question text so a new question remounts this element
    // instead of reusing the DOM node — otherwise the browser's native
    // `open` state on <details> would carry over and a translation left
    // expanded would stay expanded on the next question.
    <details
      className={`group flex flex-col justify-center text-center [&_summary::-webkit-details-marker]:hidden [&_summary::marker]:content-none ${bare ? minHeightClass : `sticker-panel w-full ${minHeightClass} p-6`
        }`}
    >
      <summary className={`cursor-pointer ${summaryClassName}`}>
        <div className="flex items-center justify-center relative px-12 pt-4">
          {question}
          {lang && <PronounceButton text={question} lang={lang} />}
        </div>
        <span className="mt-1 block font-body text-xs font-semibold text-ink/50 group-open:hidden">
          🌐 Tap to see translation
        </span>
      </summary>
      <p className="mt-3 border-t-2 border-ink/10 pt-3 font-body text-base font-semibold text-ink/70">
        {translation}
      </p>
    </details>
  );
}
