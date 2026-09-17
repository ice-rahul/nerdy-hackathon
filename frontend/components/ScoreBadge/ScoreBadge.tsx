// Keying on the score value forces a remount whenever it changes, replaying
// the pop-scale animation each time a point is earned instead of just
// silently re-rendering new text.
export function ScoreBadge({ score }: { score: number }) {
  return (
    <span key={score} className="badge-score animate-score-pop">
      🏅 Score: {score}
    </span>
  );
}
