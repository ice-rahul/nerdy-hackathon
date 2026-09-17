// Placeholder answer buttons shown while an exercise is still streaming in.
// Deliberately reuses the real .option-btn class (just muted colors) rather
// than a hand-picked height, so the boxes are pixel-identical to the real
// buttons that replace them — that's what makes the swap from skeleton to
// real options a zero-layout-shift reveal instead of the grid growing (and
// pushing everything below it down) the moment the exercise finishes loading.
export function OptionsSkeleton({ count }: { count: number }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          aria-hidden
          className="option-btn pointer-events-none animate-pulse border-ink/10 bg-ink/5 text-transparent shadow-none"
        >
          placeholder
        </div>
      ))}
    </>
  );
}
