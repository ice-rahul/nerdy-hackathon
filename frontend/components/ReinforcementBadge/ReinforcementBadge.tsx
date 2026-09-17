"use client";

import { useEffect, useRef } from "react";
import { useFeedback } from "@/lib/feedback/FeedbackContext";
import { useSession } from "@/lib/session/SessionContext";
import { getGuidanceCopy } from "@/lib/feedback/guidanceCopy";

// Makes the cross-exercise reinforcement moment visible: this exercise's word(s)
// came from the same active vocabulary set introduced in Word Identification.
export function ReinforcementBadge({ words }: { words: string[] }) {
  const fx = useFeedback();
  const { preferredLanguage } = useSession();
  const wordKey = words.join("|");
  const announcedKey = useRef<string | null>(null);

  useEffect(() => {
    if (words.length === 0 || announcedKey.current === wordKey) return;
    announcedKey.current = wordKey;
    const guidance = getGuidanceCopy(preferredLanguage);
    fx.say(guidance.reinforcementLine(words), "excited");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wordKey]);

  if (words.length === 0) return null;

  const wordList = words.map((word) => `"${word}"`).join(", ");
  const label =
    words.length === 1
      ? `You've seen ${wordList} before!`
      : `You've seen these words before: ${wordList}`;

  return <span className="badge-achievement">🔁 {label}</span>;
}
