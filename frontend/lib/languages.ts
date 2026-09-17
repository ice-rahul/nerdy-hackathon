export const PREFERRED_LANGUAGE_OPTIONS = ["English", "Hindi", "Spanish", "French"] as const;
// Kept in this order so the default selections (PREFERRED_LANGUAGE_OPTIONS[0]
// = "English", TARGET_LANGUAGE_OPTIONS[0] = "Spanish") never collide —
// onboarding still defensively re-picks a target if they ever do.
export const TARGET_LANGUAGE_OPTIONS = ["Spanish", "French", "German", "English", "Hindi"] as const;

export type TargetLanguage = (typeof TARGET_LANGUAGE_OPTIONS)[number];

// Exercise 1's scene data has real translated labels for all five of these
// (categories.json's per-object `label` covers es/en/fr/de/hi), so every
// target-language option has real content to show, not a fallback.
export const TARGET_LANGUAGE_LABEL_KEY: Record<TargetLanguage, "es" | "fr" | "de" | "en" | "hi"> = {
  Spanish: "es",
  French: "fr",
  German: "de",
  English: "en",
  Hindi: "hi",
};

// Exercise 1's fixed UI copy ("What is this?" / "Correct!") is itself
// target-language content, not English UI chrome, so it needs to switch with
// the learner's selected target language too — otherwise a French or German
// session would show Spanish prompt text, the exact "leftover default" bug
// this feature is meant to avoid.
export const WHAT_IS_THIS: Record<TargetLanguage, string> = {
  Spanish: "¿Qué es esto?",
  French: "Qu'est-ce que c'est ?",
  German: "Was ist das?",
  English: "What is this?",
  Hindi: "यह क्या है?",
};

export const CORRECT_EXCLAMATION: Record<TargetLanguage, string> = {
  Spanish: "¡Correcto!",
  French: "Correct !",
  German: "Richtig!",
  English: "Correct!",
  Hindi: "सही!",
};

// Exercise 1's object labels cover es/en/fr/de/hi — every preferred-language
// option has a real translated label to show on the study screen.
export const PREFERRED_LANGUAGE_LABEL_KEY: Partial<Record<string, "es" | "en" | "fr" | "hi">> = {
  English: "en",
  Hindi: "hi",
  Spanish: "es",
  French: "fr",
};

// BCP-47 code for pronouncing a target-language word aloud (the "listen"
// button on each Exercise 1 object) — deliberately separate from the
// mascot's own guidance-speech language in guidanceCopy.ts, since these are
// two different voices for two different purposes: one reads target-language
// vocabulary, the other coaches in the learner's native language.
export const TARGET_LANGUAGE_SPEECH_CODE: Record<TargetLanguage, string> = {
  Spanish: "es-ES",
  French: "fr-FR",
  German: "de-DE",
  English: "en-US",
  Hindi: "hi-IN",
};
