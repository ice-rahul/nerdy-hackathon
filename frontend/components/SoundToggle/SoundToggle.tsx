"use client";

import { useFeedback } from "@/lib/feedback/FeedbackContext";

export function SoundToggle() {
  const { muted, toggleMuted } = useFeedback();

  return (
    <button
      type="button"
      onClick={toggleMuted}
      aria-label={muted ? "Unmute sound" : "Mute sound"}
      title={muted ? "Unmute sound" : "Mute sound"}
      className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full border-4 border-ink bg-white text-lg shadow-sticker-sm transition-transform hover:-translate-y-0.5"
    >
      {muted ? "🔇" : "🔊"}
    </button>
  );
}
