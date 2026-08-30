"use client";

import Link from "next/link";
import { useSession } from "@/lib/session/SessionContext";
import { EXERCISE_ORDER } from "@/lib/session/order";
import { LanguageBar } from "@/components/LanguageBar/LanguageBar";

export default function ProgressPage() {
  const { activeVocabulary, sessionStarted, scores, completed } = useSession();

  const totalScore = Object.values(scores).reduce(
    (sum, score) => sum + (score ?? 0),
    0
  );

  if (!sessionStarted) {
    return (
      <div className="flex flex-1 flex-col">
        <LanguageBar />
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-16">
          <h1 className="font-display text-2xl font-bold text-ink">Progress</h1>
          <p className="font-body font-semibold text-ink/70">
            No session yet — start with Word Identification to begin one.
          </p>
          <Link href="/exercises/word-identification" className="btn-quest">
            Start a session
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <LanguageBar />
      <div className="flex flex-1 flex-col items-center gap-8 px-4 py-16">
      <h1 className="font-display text-2xl font-bold text-ink">Progress</h1>

      {completed && (
        <div className="sticker-panel w-full max-w-md border-treasure bg-treasure/20 p-6 text-center">
          <p className="font-display text-2xl font-bold text-ink">
            🎉 Session complete!
          </p>
          <p className="badge-score mt-3 inline-flex">
            🏅 Total score: {totalScore}
          </p>
        </div>
      )}

      <div className="w-full max-w-md">
        <h2 className="mb-2 font-display text-sm font-bold text-ink/70">
          Words seen this session
        </h2>
        <div className="flex flex-wrap gap-2">
          {activeVocabulary.map((word) => (
            <span
              key={word}
              className="rounded-full border-4 border-ink bg-explorer px-3 py-1 font-display text-sm font-bold text-white shadow-sticker-sm"
            >
              {word}
            </span>
          ))}
        </div>
      </div>

      <div className="w-full max-w-md">
        <h2 className="mb-2 font-display text-sm font-bold text-ink/70">
          Scores by exercise
        </h2>
        <ul className="flex flex-col gap-3">
          {EXERCISE_ORDER.map((exercise) => {
            const score = scores[exercise.key];
            const attempted = score !== undefined;
            return (
              <li
                key={exercise.key}
                className={`sticker-panel flex items-center justify-between px-4 py-3 ${
                  attempted ? "border-win" : "border-ink/30 opacity-70"
                }`}
              >
                <span className="font-display font-bold text-ink">
                  {exercise.label}
                  {exercise.optional && (
                    <span className="ml-1 font-body text-xs font-semibold text-ink/50">
                      (optional)
                    </span>
                  )}
                </span>
                <span
                  className={`flex h-10 min-w-10 items-center justify-center rounded-full border-4 border-ink px-2 font-display text-sm font-bold ${
                    attempted ? "bg-treasure text-ink" : "bg-white text-ink/50"
                  }`}
                >
                  {attempted ? (
                    `🏆 ${score}`
                  ) : (
                    <>
                      <span aria-hidden>—</span>
                      <span className="sr-only">Not attempted</span>
                    </>
                  )}
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      <Link href="/" className="btn-ghost">
        Back to home
      </Link>
      </div>
    </div>
  );
}
