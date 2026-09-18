"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/session/SessionContext";
import { useFeedback } from "@/lib/feedback/FeedbackContext";
import { PREFERRED_LANGUAGE_OPTIONS, TARGET_LANGUAGE_OPTIONS } from "@/lib/languages";

export default function OnboardingPage() {
  const router = useRouter();
  const { completeOnboarding } = useSession();
  const fx = useFeedback();
  const greeted = useRef(false);

  useEffect(() => {
    if (greeted.current) return;
    greeted.current = true;
    fx.say("Ready to start your quest?", "excited");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [name, setName] = useState("");
  const [preferredLanguage, setPreferredLanguage] = useState<string>(
    PREFERRED_LANGUAGE_OPTIONS[0]
  );
  // Lazy initializer rather than a bare TARGET_LANGUAGE_OPTIONS[0]: guards
  // against the two option lists' first entries ever colliding (they don't
  // today, since PREFERRED_LANGUAGE_OPTIONS[0] is "English" and
  // TARGET_LANGUAGE_OPTIONS[0] is "Spanish", but list order is easy to
  // change later without noticing this constraint).
  const [targetLanguage, setTargetLanguage] = useState<string>(
    () => TARGET_LANGUAGE_OPTIONS.find((language) => language !== PREFERRED_LANGUAGE_OPTIONS[0]) ?? TARGET_LANGUAGE_OPTIONS[0]
  );

  // Spanish and French appear in both option lists (you can speak either as
  // your native language, or be learning it) — without this, a Spanish
  // speaker could "learn" Spanish. Hide whichever target matches the
  // learner's native language, and if the current target was that language,
  // fall back to the first one that's still valid.
  const availableTargetLanguages = TARGET_LANGUAGE_OPTIONS.filter(
    (language) => language !== preferredLanguage
  );

  function handlePreferredLanguageChange(value: string) {
    setPreferredLanguage(value);
    if (value === targetLanguage) {
      setTargetLanguage(
        TARGET_LANGUAGE_OPTIONS.find((language) => language !== value) ?? TARGET_LANGUAGE_OPTIONS[0]
      );
    }
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) return;

    completeOnboarding({
      learnerName: trimmedName,
      preferredLanguage,
      targetLanguage,
    });
    router.push("/");
  }

  return (
    <div className="relative flex flex-1 flex-col items-center justify-center gap-8 overflow-hidden px-4 py-16">
      {/* Quiet warmth behind the wordmark — the one decorative flourish on
          this page, everything else stays plain per the sticker-book system
          elsewhere (no gradients, no soft shadows). */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-0 left-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/3 rounded-full bg-treasure/30 blur-3xl"
      />

      <header className="relative flex flex-col items-center gap-3 text-center">
        <span className="badge-score">🦉 LinguaBuild</span>
        <p className="max-w-sm font-body font-semibold text-ink/70">
          Meet each word five times, five different ways — not flashcards on
          repeat. Pick a language below and we&apos;ll walk you through
          recognition, comprehension, and production in one session.
        </p>

        <h1 className="mt-2 font-display text-3xl font-bold text-ink">
          Welcome, adventurer!
        </h1>
        <p className="max-w-sm font-body font-semibold text-ink/70">
          Tell us about yourself before you start your quest.
        </p>
      </header>

      <form
        onSubmit={handleSubmit}
        className="sticker-panel relative flex w-full max-w-sm flex-col gap-5 p-6"
      >
        <div className="flex flex-col gap-1.5">
          <label htmlFor="name" className="font-display text-sm font-bold text-ink">
            🧑 Your name
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="What should we call you?"
            className="rounded-2xl border-4 border-ink bg-white px-4 py-3 font-body text-base font-bold text-ink shadow-sticker-sm focus:outline-none"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="preferred-language" className="font-display text-sm font-bold text-ink">
            🗣️ Language you speak
          </label>
          <select
            id="preferred-language"
            value={preferredLanguage}
            onChange={(event) => handlePreferredLanguageChange(event.target.value)}
            className="rounded-2xl border-4 border-ink bg-white px-4 py-3 font-body text-base font-bold text-ink shadow-sticker-sm focus:outline-none"
          >
            {PREFERRED_LANGUAGE_OPTIONS.map((language) => (
              <option key={language} value={language}>
                {language}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="target-language" className="font-display text-sm font-bold text-ink">
            🎯 Language you want to learn
          </label>
          <select
            id="target-language"
            value={targetLanguage}
            onChange={(event) => setTargetLanguage(event.target.value)}
            className="rounded-2xl border-4 border-ink bg-white px-4 py-3 font-body text-base font-bold text-ink shadow-sticker-sm focus:outline-none"
          >
            {availableTargetLanguages.map((language) => (
              <option key={language} value={language}>
                {language}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={!name.trim()}
          className="btn-quest mt-2"
        >
          Start my adventure →
        </button>
      </form>
    </div>
  );
}
