"use client";

import Link from "next/link";
import { useSession } from "@/lib/session/SessionContext";
import { RequireOnboarding } from "@/components/RequireOnboarding/RequireOnboarding";

const QUEST_TILES = [
  {
    href: "/exercises/word-identification",
    level: 1,
    icon: "🗺️",
    title: "Word Identification",
    blurb: "Pick a category, study the words, then test yourself.",
    accent: "quest",
    bonus: false,
  },
  {
    href: "/exercises/qa",
    level: 2,
    icon: "💬",
    title: "Guided Q&A",
    blurb: "Answer situational questions.",
    accent: "explorer",
    bonus: false,
  },
  {
    href: "/exercises/paragraph-summary",
    level: 3,
    icon: "📖",
    title: "Paragraph Summary",
    blurb: "Read a short story and pick the true summary.",
    accent: "quest",
    bonus: false,
  },
  {
    href: "/exercises/fill-in-the-blank",
    level: 4,
    icon: "✏️",
    title: "Fill in the Blanks",
    blurb: "Complete the sentence with the right word.",
    accent: "explorer",
    bonus: false,
  },
  {
    href: "/exercises/free-response",
    level: 5,
    icon: "🏆",
    title: "Moment of Truth",
    blurb: "Type your own answer — no multiple choice!",
    accent: "treasure",
    bonus: true,
  },
] as const;

const ACCENT_BORDER: Record<string, string> = {
  quest: "border-quest",
  explorer: "border-explorer",
  treasure: "border-treasure",
};

const ACCENT_BG: Record<string, string> = {
  quest: "bg-quest",
  explorer: "bg-explorer",
  treasure: "bg-treasure",
};

function HomeContent() {
  const { learnerName, targetLanguage } = useSession();

  return (
    <div className="flex flex-1 flex-col items-center gap-12 px-4 py-16">
      <header className="flex flex-col items-center gap-2 text-center">
        <h1 className="font-display text-4xl font-bold text-ink sm:text-5xl">
          LinguaBuild
        </h1>
        <p className="max-w-md font-body text-lg font-semibold text-ink/70">
          Hi {learnerName}! Your {targetLanguage} adventure — complete each
          quest to level up.
        </p>
      </header>

      <ol className="relative flex w-full max-w-xl flex-col items-stretch gap-8">
        <div
          aria-hidden
          className="pointer-events-none absolute top-0 left-1/2 h-full w-0 -translate-x-1/2 border-l-4 border-dashed border-ink/25 max-sm:hidden"
        />

        {QUEST_TILES.map((tile, index) => (
          <li
            key={tile.href}
            className={`relative w-full sm:w-[85%] ${
              index % 2 === 0 ? "sm:self-start" : "sm:self-end"
            }`}
          >
            <Link
              href={tile.href}
              className={`sticker-panel group flex items-center gap-4 border-4 p-5 transition-transform hover:-translate-y-1 hover:shadow-sticker-lg ${ACCENT_BORDER[tile.accent]}`}
            >
              <span
                className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-4 border-ink font-display text-xl font-bold text-white ${ACCENT_BG[tile.accent]}`}
              >
                {tile.level}
              </span>

              <span className="flex flex-1 flex-col gap-0.5">
                <span className="flex items-center gap-2 font-display text-lg font-bold text-ink">
                  <span aria-hidden>{tile.icon}</span>
                  {tile.title}
                  {tile.bonus && (
                    <span className="rounded-full border-2 border-ink bg-treasure px-2 py-0.5 font-display text-xs font-bold text-ink">
                      BONUS
                    </span>
                  )}
                </span>
                <span className="font-body text-sm font-semibold text-ink/70">
                  {tile.blurb}
                </span>
              </span>

              <span
                aria-hidden
                className="font-display text-xl font-bold text-ink/40 transition-transform group-hover:translate-x-1"
              >
                →
              </span>
            </Link>
          </li>
        ))}
      </ol>

      <Link href="/progress" className="btn-explorer">
        🏅 View progress
      </Link>

      <footer className="mt-4">
        <Link href="/credits" className="btn-ghost">
          Credits
        </Link>
      </footer>
    </div>
  );
}

export default function Home() {
  return (
    <RequireOnboarding>
      <HomeContent />
    </RequireOnboarding>
  );
}
