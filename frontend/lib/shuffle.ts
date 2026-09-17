// Fisher-Yates shuffle. Generated option arrays always put the correct answer
// first — never trust generation order, always shuffle client-side.
export function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// AI-generated option sets occasionally repeat a distractor (or repeat the
// correct answer as a "distractor"), which produces a React duplicate-key
// warning and an MCQ with a free extra guess. Dedupe by key before shuffling
// — when a duplicate group contains an item `preferCorrect` flags, that one
// wins so the real answer is never the one silently dropped.
export function dedupeByKey<T>(
  items: T[],
  keyFn: (item: T) => string,
  preferCorrect?: (item: T) => boolean
): T[] {
  const seen = new Map<string, T>();
  for (const item of items) {
    const key = keyFn(item);
    const existing = seen.get(key);
    if (!existing || (preferCorrect?.(item) && !preferCorrect?.(existing))) {
      seen.set(key, item);
    }
  }
  return Array.from(seen.values());
}
