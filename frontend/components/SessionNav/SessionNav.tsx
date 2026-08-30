"use client";

import Link from "next/link";
import { getNextExercise, type ExerciseKey } from "@/lib/session/order";
import { useSession } from "@/lib/session/SessionContext";

export function SessionNav({ current }: { current: ExerciseKey }) {
  const next = getNextExercise(current);
  const { completeSession } = useSession();

  if (!next) {
    return (
      <Link href="/" onClick={completeSession} className="btn-quest">
        Finish session — back to home
      </Link>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-3">
      {next.optional && (
        <Link href="/" onClick={completeSession} className="btn-ghost">
          Finish session (skip {next.label})
        </Link>
      )}
      <Link href={next.path} className="btn-quest">
        Next Exercise: {next.label} →
      </Link>
    </div>
  );
}
