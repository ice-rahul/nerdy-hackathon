"use client";

import { useEffect, useState } from "react";
import { useFeedback } from "@/lib/feedback/FeedbackContext";

const COLORS = ["#ff6b35", "#0e8388", "#ffc93c", "#2fbf71", "#e5484d"];
const PIECES_PER_BURST = 24;
const BURST_LIFETIME_MS = 1700;

function makePieces() {
  return Array.from({ length: PIECES_PER_BURST }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 0.15,
    duration: 0.9 + Math.random() * 0.6,
    color: COLORS[i % COLORS.length],
  }));
}

function ConfettiBurst({ onDone }: { onDone: () => void }) {
  // Lazy initializer: runs exactly once per mounted burst, not on every
  // render, so the random layout is stable — unlike a useMemo factory, this
  // is the documented escape hatch for one-time impure setup in React.
  const [pieces] = useState(makePieces);

  useEffect(() => {
    const timer = setTimeout(onDone, BURST_LIFETIME_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-40 overflow-hidden">
      {pieces.map((piece) => (
        <span
          key={piece.id}
          className="absolute top-[-10px] h-2.5 w-2.5 rounded-sm animate-confetti-fall"
          style={{
            left: `${piece.left}%`,
            backgroundColor: piece.color,
            animationDelay: `${piece.delay}s`,
            animationDuration: `${piece.duration}s`,
          }}
        />
      ))}
    </div>
  );
}

// One-shot celebration bursts, fired via useFeedback().celebrate()/levelUp().
// Rendered once at the app root (see providers.tsx).
export function Confetti() {
  const { bursts, clearBurst } = useFeedback();

  return (
    <>
      {bursts.map((burst) => (
        <ConfettiBurst key={burst.id} onDone={() => clearBurst(burst.id)} />
      ))}
    </>
  );
}
