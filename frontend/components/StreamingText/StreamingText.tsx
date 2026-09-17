// Shows AI-generated text as it streams in, with a blinking cursor at the
// tail — replaces a static "Loading exercise..." spinner with the actual
// content appearing progressively. Only ever fed a "safe" field (a
// sentence/question/paragraph) — options and correct answers are
// deliberately withheld until the full response is parsed and shuffled, so
// streaming can never reveal an answer via arrival order.
export function StreamingText({
  text,
  align = "center",
  minHeightClass = "min-h-28",
}: {
  text: string;
  align?: "left" | "center";
  // Reserves the same vertical space the final, fully-streamed panel will
  // need (see the matching prop on TranslatableQuestion / the plain
  // paragraph panel) — without this, the panel grows with every chunk and
  // everything below it (options, buttons) visibly jumps down as text
  // streams in, and jumps again the moment loading finishes.
  minHeightClass?: string;
}) {
  return (
    <p
      className={`sticker-panel w-full ${minHeightClass} p-6 font-body text-lg font-bold text-ink ${
        align === "left" ? "text-left" : "text-center"
      }`}
    >
      {text}
      <span className="ml-0.5 inline-block w-2 animate-pulse" aria-hidden>
        ▊
      </span>
    </p>
  );
}
