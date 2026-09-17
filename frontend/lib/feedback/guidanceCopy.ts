// The mascot's own voice — encouragement, greetings, level-up lines — is
// meta-guidance *about* the lesson, not the lesson content itself. A Hindi
// speaker learning Spanish should be coached in Hindi, not in English just
// because English is this codebase's default. Keyed by PREFERRED_LANGUAGE_OPTIONS
// (lib/languages.ts); anything not listed here falls back to English.
type GuidanceCopy = {
  speechLang: string;
  happyLines: string[];
  oopsLines: string[];
  levelUpLine: string;
  sessionCompleteLine: (score: number) => string;
  greetingLine: (name: string, targetLanguage: string) => string;
  reinforcementLine: (words: string[]) => string;
};

const ENGLISH: GuidanceCopy = {
  speechLang: "en-US",
  happyLines: ["Nice work!", "You got it!", "Great job!", "That's it!"],
  oopsLines: ["Almost — try again!", "Not quite, keep going!", "So close!"],
  levelUpLine: "Level complete! On to the next adventure!",
  sessionCompleteLine: (score) => `Quest complete! You scored ${score} points today — amazing work!`,
  greetingLine: (name, targetLanguage) => `Ready, ${name}? Let's explore ${targetLanguage} together!`,
  reinforcementLine: (words) =>
    words.length === 1
      ? `Remember "${words[0]}"? We met before!`
      : `Remember these words? We met them before!`,
};

const HINDI: GuidanceCopy = {
  speechLang: "hi-IN",
  happyLines: ["बहुत बढ़िया!", "आपने कर दिखाया!", "शाबाश!", "यह रहा!"],
  oopsLines: ["लगभग सही — फिर कोशिश करो!", "बिल्कुल नहीं, कोशिश जारी रखो!", "बहुत करीब थे!"],
  levelUpLine: "स्तर पूरा हुआ! अगले रोमांच की ओर बढ़ें!",
  sessionCompleteLine: (score) => `क्वेस्ट पूरा हुआ! आपने आज ${score} अंक हासिल किए — शानदार काम!`,
  greetingLine: (name, targetLanguage) => `तैयार हो, ${name}? चलो साथ में ${targetLanguage} सीखते हैं!`,
  reinforcementLine: (words) =>
    words.length === 1
      ? `याद है "${words[0]}"? हम पहले भी मिल चुके हैं!`
      : `याद हैं ये शब्द? हम पहले भी मिल चुके हैं!`,
};

const SPANISH: GuidanceCopy = {
  speechLang: "es-ES",
  happyLines: ["¡Buen trabajo!", "¡Lo lograste!", "¡Genial!", "¡Eso es!"],
  oopsLines: ["Casi — ¡inténtalo de nuevo!", "No es correcto, ¡sigue intentando!", "¡Muy cerca!"],
  levelUpLine: "¡Nivel completado! Hacia la siguiente aventura!",
  sessionCompleteLine: (score) => `¡Misión completada! Hoy conseguiste ${score} puntos — ¡excelente trabajo!`,
  greetingLine: (name, targetLanguage) => `¿Listo, ${name}? ¡Exploremos ${targetLanguage} juntos!`,
  reinforcementLine: (words) =>
    words.length === 1
      ? `¿Recuerdas "${words[0]}"? ¡Ya nos conocíamos!`
      : `¿Recuerdas estas palabras? ¡Ya nos conocíamos!`,
};

const FRENCH: GuidanceCopy = {
  speechLang: "fr-FR",
  happyLines: ["Bon travail !", "Tu l'as fait !", "Génial !", "C'est ça !"],
  oopsLines: ["Presque — réessaie !", "Pas tout à fait, continue !", "Si proche !"],
  levelUpLine: "Niveau terminé ! En route pour la prochaine aventure !",
  sessionCompleteLine: (score) => `Quête terminée ! Tu as obtenu ${score} points aujourd'hui — excellent travail !`,
  greetingLine: (name, targetLanguage) => `Prêt, ${name} ? Explorons ${targetLanguage} ensemble !`,
  reinforcementLine: (words) =>
    words.length === 1
      ? `Tu te souviens de "${words[0]}" ? On s'est déjà rencontrés !`
      : `Tu te souviens de ces mots ? On s'est déjà rencontrés !`,
};

const GUIDANCE_BY_LANGUAGE: Record<string, GuidanceCopy> = {
  English: ENGLISH,
  Hindi: HINDI,
  Spanish: SPANISH,
  French: FRENCH,
};

export function getGuidanceCopy(preferredLanguage: string | null | undefined): GuidanceCopy {
  return GUIDANCE_BY_LANGUAGE[preferredLanguage ?? ""] ?? ENGLISH;
}

// A guidance line switching mid-sentence from the learner's script into a
// bare English target-language name (e.g. a Hindi sentence containing the
// literal Latin word "Spanish") reads — and sounds, spoken aloud — like
// broken text, not a translation. TARGET_LANGUAGE_OPTIONS (lib/languages.ts)
// is a small closed set, so every combination can just be named directly.
const TARGET_LANGUAGE_NAME: Record<string, Record<string, string>> = {
  English: { Spanish: "Spanish", French: "French", German: "German", English: "English", Hindi: "Hindi" },
  Hindi: { Spanish: "स्पेनिश", French: "फ़्रेंच", German: "जर्मन", English: "अंग्रेज़ी", Hindi: "हिंदी" },
  Spanish: { Spanish: "español", French: "francés", German: "alemán", English: "inglés", Hindi: "hindi" },
  French: { Spanish: "espagnol", French: "français", German: "allemand", English: "anglais", Hindi: "hindi" },
};

export function localizeTargetLanguage(
  preferredLanguage: string | null | undefined,
  targetLanguage: string
): string {
  const table = TARGET_LANGUAGE_NAME[preferredLanguage ?? ""];
  return table?.[targetLanguage] ?? targetLanguage;
}
