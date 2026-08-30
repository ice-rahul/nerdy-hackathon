export const PREFERRED_LANGUAGE_OPTIONS = ["English", "Hindi", "Spanish", "French"] as const;
export const TARGET_LANGUAGE_OPTIONS = ["Spanish", "French", "German"] as const;

export type TargetLanguage = (typeof TARGET_LANGUAGE_OPTIONS)[number];

// Exercise 1's scene data only has real translated labels for these three —
// the target-language options above are scoped to exactly what's supported.
export const TARGET_LANGUAGE_LABEL_KEY: Record<TargetLanguage, "es" | "fr" | "de"> = {
  Spanish: "es",
  French: "fr",
  German: "de",
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
};

export const CORRECT_EXCLAMATION: Record<TargetLanguage, string> = {
  Spanish: "¡Correcto!",
  French: "Correct !",
  German: "Richtig!",
};

// Exercise 1's object labels also only cover es/en/fr/de — a learner whose
// preferred language is Hindi has no real translated label to show on the
// study screen, so fall back to English (the one preferred-language option
// always guaranteed to be available) rather than showing nothing.
export const PREFERRED_LANGUAGE_LABEL_KEY: Partial<Record<string, "es" | "en" | "fr">> = {
  English: "en",
  Spanish: "es",
  French: "fr",
};
