"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { STARTER_PHRASES } from "@/lib/exercises";
import type { ExerciseKey } from "@/lib/session/order";

const STORAGE_KEY = "linguabuild:session";

type Scores = Partial<Record<ExerciseKey, number>>;

type LearnerProfile = {
  learnerName: string | null;
  preferredLanguage: string | null;
  targetLanguage: string | null;
};

type StoredSession = LearnerProfile & {
  activeVocabulary: string[];
  sessionStarted: boolean;
  scores: Scores;
  completed: boolean;
};

type SessionContextValue = StoredSession & {
  // True once this provider has checked localStorage at least once. Consumers
  // that act on session data in a mount effect (generating an exercise's AI
  // prompt, redirecting when onboarding isn't complete, say) must gate on
  // this — otherwise, on a hard reload, their effect can fire before
  // hydration (child effects run before parent effects) and read the still-
  // default/empty session instead of the real one.
  hydrated: boolean;
  onboarded: boolean;
  startSession: (vocabulary: string[]) => void;
  recordScore: (exercise: ExerciseKey, score: number) => void;
  completeSession: () => void;
  completeOnboarding: (profile: {
    learnerName: string;
    preferredLanguage: string;
    targetLanguage: string;
  }) => void;
};

const SessionContext = createContext<SessionContextValue | null>(null);

const DEFAULT_SESSION: StoredSession = {
  activeVocabulary: STARTER_PHRASES,
  sessionStarted: false,
  scores: {},
  completed: false,
  learnerName: null,
  preferredLanguage: null,
  targetLanguage: null,
};

function loadStored(): StoredSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredSession;
    return parsed.activeVocabulary?.length ? { ...DEFAULT_SESSION, ...parsed } : null;
  } catch {
    return null;
  }
}

function persist(session: StoredSession) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function SessionProvider({ children }: { children: React.ReactNode }) {
  // All fields live in one state object so recordScore/completeSession/
  // completeOnboarding can update them via a single functional setState —
  // that guarantees the updater always runs against the true latest state,
  // never a stale closure over an individual field.
  const [session, setSession] = useState<StoredSession>(DEFAULT_SESSION);

  // React fires child effects before parent effects on mount. Every exercise
  // component calls recordScore in its own mount effect (even for the
  // starting score of 0), which fires *before* this provider's own
  // localStorage-hydration effect below has run. Without this guard, that
  // premature call would persist the still-default, un-hydrated session —
  // overwriting a real session from a previous page load moments before
  // hydration reads it back. Gate the *write* to localStorage on hydration
  // having actually run at least once; the in-memory update is still applied
  // (functionally, against the latest queued state) and gets correctly
  // superseded by the hydration read that follows in the same commit, so
  // nothing is lost — only the premature disk write is skipped.
  const hydratedRef = useRef(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = loadStored();
    if (stored) {
      setSession(stored);
    }
    hydratedRef.current = true;
    setHydrated(true);
  }, []);

  function startSession(vocabulary: string[]) {
    setSession((prev) => {
      // Preserve the learner's onboarding profile — starting a new practice
      // session resets progress, not who's learning or which languages.
      const next: StoredSession = {
        ...prev,
        activeVocabulary: vocabulary,
        sessionStarted: true,
        scores: {},
        completed: false,
      };
      persist(next);
      return next;
    });
  }

  function recordScore(exercise: ExerciseKey, score: number) {
    setSession((prev) => {
      if (prev.scores[exercise] === score) return prev;
      const next = { ...prev, scores: { ...prev.scores, [exercise]: score } };
      if (hydratedRef.current) persist(next);
      return next;
    });
  }

  function completeSession() {
    setSession((prev) => {
      const next = { ...prev, completed: true };
      if (hydratedRef.current) persist(next);
      return next;
    });
  }

  function completeOnboarding(profile: {
    learnerName: string;
    preferredLanguage: string;
    targetLanguage: string;
  }) {
    // Always a real user action (a form submit), never a mount effect, so it
    // can't race hydration the way recordScore's automatic mount call can —
    // write immediately rather than risk silently discarding the learner's
    // answers if this were ever gated.
    setSession((prev) => {
      const next = { ...prev, ...profile };
      persist(next);
      return next;
    });
  }

  const onboarded = Boolean(
    session.learnerName && session.preferredLanguage && session.targetLanguage
  );

  return (
    <SessionContext.Provider
      value={{
        ...session,
        hydrated,
        onboarded,
        startSession,
        recordScore,
        completeSession,
        completeOnboarding,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return context;
}
