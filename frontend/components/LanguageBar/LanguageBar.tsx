"use client";

import Link from "next/link";
import { useSession } from "@/lib/session/SessionContext";

// Persistent strip showing who's learning what — shown once onboarding is
// complete, on the homepage, every exercise page, and the progress page.
export function LanguageBar() {
  const { onboarded, learnerName, targetLanguage, preferredLanguage } = useSession();

  if (!onboarded) return null;

  return (
    <div className="flex w-full flex-wrap items-center justify-center gap-x-2 gap-y-1 border-b-4 border-ink bg-treasure px-4 py-2 text-center font-display text-sm font-bold text-ink">
      <Link
        href="/"
        className="underline decoration-2 underline-offset-2 opacity-70 transition-opacity hover:opacity-100"
      >
        🏠 Home
      </Link>
      <span aria-hidden className="opacity-40">
        |
      </span>
      <span>
        {learnerName} · Learning {targetLanguage} · Native {preferredLanguage}
      </span>
      <Link
        href="/onboarding"
        className="underline decoration-2 underline-offset-2 opacity-70 transition-opacity hover:opacity-100"
      >
        Change
      </Link>
    </div>
  );
}
