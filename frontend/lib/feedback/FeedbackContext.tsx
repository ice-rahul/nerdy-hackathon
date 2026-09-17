"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { playSoundKind, primeAudio } from "./sound";
import { primeSpeech, speak, stopSpeaking } from "./speech";
import { getGuidanceCopy } from "./guidanceCopy";
import { useSession } from "@/lib/session/SessionContext";

const MUTE_STORAGE_KEY = "linguabuild:sound-muted";

export type MascotMood = "happy" | "oops" | "excited" | "neutral";

type MascotMessage = { id: number; text: string; mood: MascotMood };
type ConfettiBurst = { id: number };

type FeedbackContextValue = {
  muted: boolean;
  toggleMuted: () => void;
  message: MascotMessage | null;
  say: (text: string, mood?: MascotMood) => void;
  celebrate: (text?: string) => void;
  stumble: (text?: string) => void;
  levelUp: (text?: string) => void;
  bursts: ConfettiBurst[];
  clearBurst: (id: number) => void;
};

const FeedbackContext = createContext<FeedbackContextValue | null>(null);

export function FeedbackProvider({ children }: { children: React.ReactNode }) {
  // The mascot's own lines (encouragement, level-up, greetings) are
  // guidance, not lesson content — they're spoken in the learner's
  // preferred/native language, never the language being practiced.
  // FeedbackProvider is mounted inside SessionProvider (see providers.tsx),
  // so this is always available.
  const { preferredLanguage } = useSession();
  const guidance = useMemo(() => getGuidanceCopy(preferredLanguage), [preferredLanguage]);
  const [muted, setMuted] = useState(false);
  const [message, setMessage] = useState<MascotMessage | null>(null);
  const [bursts, setBursts] = useState<ConfettiBurst[]>([]);
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const messageId = useRef(0);
  const burstId = useRef(0);
  const mutedRef = useRef(muted);

  useEffect(() => {
    try {
      setMuted(window.localStorage.getItem(MUTE_STORAGE_KEY) === "1");
    } catch {
      // localStorage unavailable — default to unmuted.
    }
  }, []);

  useEffect(() => {
    mutedRef.current = muted;
  }, [muted]);

  // Resume the shared AudioContext / speech engine directly inside the raw
  // browser event, not from a React effect reacting to it — see sound.ts
  // for why that distinction is what makes correct/incorrect tones (and
  // spoken mascot lines) actually audible.
  useEffect(() => {
    function primeAll() {
      primeAudio();
      primeSpeech();
    }
    window.addEventListener("pointerdown", primeAll);
    window.addEventListener("keydown", primeAll);
    return () => {
      window.removeEventListener("pointerdown", primeAll);
      window.removeEventListener("keydown", primeAll);
    };
  }, []);

  const toggleMuted = useCallback(() => {
    setMuted((prev) => {
      const next = !prev;
      if (next) stopSpeaking();
      try {
        window.localStorage.setItem(MUTE_STORAGE_KEY, next ? "1" : "0");
      } catch {
        // localStorage unavailable — in-memory toggle still works.
      }
      return next;
    });
  }, []);

  // Sets the speech-bubble text and speaks it aloud — this is the mascot's
  // one voice, shared by a standalone say() (greetings, reinforcement
  // callouts) and by celebrate/stumble/levelUp, which layer their own
  // distinct tone on top of the same spoken line.
  const say = useCallback(
    (text: string, mood: MascotMood = "neutral") => {
      if (dismissTimer.current) clearTimeout(dismissTimer.current);
      messageId.current += 1;
      setMessage({ id: messageId.current, text, mood });
      dismissTimer.current = setTimeout(() => setMessage(null), 3800);
      if (!mutedRef.current) speak(text, guidance.speechLang);
    },
    [guidance.speechLang]
  );

  const fireConfetti = useCallback(() => {
    burstId.current += 1;
    setBursts((prev) => [...prev, { id: burstId.current }]);
  }, []);

  const clearBurst = useCallback((id: number) => {
    setBursts((prev) => prev.filter((burst) => burst.id !== id));
  }, []);

  const celebrate = useCallback(
    (text?: string) => {
      if (!mutedRef.current) playSoundKind("correct");
      fireConfetti();
      const { happyLines } = guidance;
      say(text ?? happyLines[Math.floor(Math.random() * happyLines.length)], "happy");
    },
    [fireConfetti, say, guidance]
  );

  const stumble = useCallback(
    (text?: string) => {
      if (!mutedRef.current) playSoundKind("incorrect");
      const { oopsLines } = guidance;
      say(text ?? oopsLines[Math.floor(Math.random() * oopsLines.length)], "oops");
    },
    [say, guidance]
  );

  const levelUp = useCallback(
    (text?: string) => {
      if (!mutedRef.current) playSoundKind("levelup");
      fireConfetti();
      say(text ?? guidance.levelUpLine, "excited");
    },
    [fireConfetti, say, guidance]
  );

  return (
    <FeedbackContext.Provider
      value={{
        muted,
        toggleMuted,
        message,
        say,
        celebrate,
        stumble,
        levelUp,
        bursts,
        clearBurst,
      }}
    >
      {children}
    </FeedbackContext.Provider>
  );
}

export function useFeedback() {
  const context = useContext(FeedbackContext);
  if (!context) {
    throw new Error("useFeedback must be used within a FeedbackProvider");
  }
  return context;
}
