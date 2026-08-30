// Makes the cross-exercise reinforcement moment visible: this exercise's word(s)
// came from the same active vocabulary set introduced in Word Identification.
export function ReinforcementBadge({ words }: { words: string[] }) {
  if (words.length === 0) return null;

  const wordList = words.map((word) => `"${word}"`).join(", ");
  const label =
    words.length === 1
      ? `You've seen ${wordList} before!`
      : `You've seen these words before: ${wordList}`;

  return <span className="badge-achievement">🔁 {label}</span>;
}
