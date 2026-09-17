"use client";

import { useFeedback, type MascotMood } from "@/lib/feedback/FeedbackContext";

const MOOD_BORDER: Record<MascotMood, string> = {
  happy: "border-win",
  excited: "border-treasure",
  oops: "border-danger",
  neutral: "border-explorer",
};

// Fixed-position owl guide + speech bubble, rendered once at the app root
// (see providers.tsx) so any exercise can trigger a line via useFeedback().say
// without needing to know it's the one drawing the mascot.
export function Mascot() {
  const { message } = useFeedback();

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2 sm:bottom-6 sm:right-6">
      {message && (
        <div
          key={message.id}
          className={`sticker-panel pointer-events-auto max-w-[220px] animate-mascot-pop border-4 px-4 py-2.5 text-left font-body text-sm font-bold text-ink ${MOOD_BORDER[message.mood]}`}
        >
          {message.text}
        </div>
      )}
      <span
        aria-hidden
        className="pointer-events-none flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-4 border-ink bg-treasure text-2xl shadow-sticker-sm"
      >
        🦉
      </span>
    </div>
  );
}
