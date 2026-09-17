// Speaks the mascot's lines aloud via the Web Speech API — no API key, no
// network call, works fully offline. This is what makes the guide feel like
// a guide rather than a text box with a chime attached.
let unlocked = false;

// Some browsers only start speaking an utterance queued directly inside a
// user gesture; by the time a React effect reacts to a click, that window
// can have passed (the same class of bug primeAudio() in sound.ts works
// around for tones). Speak-and-cancel a silent utterance from the raw
// gesture to unlock the engine before any real line is queued.
export function primeSpeech() {
  if (unlocked) return;
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  unlocked = true;
  window.speechSynthesis.speak(new SpeechSynthesisUtterance(""));
}

// Setting `utterance.lang` alone isn't enough: if the platform's default
// voice doesn't match, some browsers silently fall back to whatever voice
// is selected in the OS/browser settings (often an English one) — which
// can't render a non-Latin script at all and ends up reading only what it
// *does* recognize: punctuation (literally, e.g. "comma") and any Latin-
// script fragments embedded in the sentence. Explicitly picking a voice
// whose own lang matches is far more reliable than lang alone.
let cachedVoices: SpeechSynthesisVoice[] = [];

function refreshVoices() {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  cachedVoices = window.speechSynthesis.getVoices();
}

if (typeof window !== "undefined" && "speechSynthesis" in window) {
  refreshVoices();
  window.speechSynthesis.onvoiceschanged = refreshVoices;
}

// macOS (and some other platforms) bundle several joke/novelty system
// voices — robotic, sung, or literally whispered — under the same language
// codes as normal ones (e.g. "Albert" and "Whisper" are both en-US, right
// alongside "Samantha"). A plain first-match lookup can land on one of
// these instead of anything resembling a real guide's voice, which is
// exactly what happened here. Named explicitly since there's no other
// signal (no quality/category flag) the Web Speech API exposes to tell them
// apart from a normal voice.
const NOVELTY_VOICE_NAMES = new Set([
  "Albert",
  "Bad News",
  "Bahh",
  "Bells",
  "Boing",
  "Bubbles",
  "Cellos",
  "Deranged",
  "Good News",
  "Hysterical",
  "Jester",
  "Organ",
  "Pipe Organ",
  "Superstar",
  "Trinoids",
  "Whisper",
  "Wobble",
  "Zarvox",
]);

function findVoiceForLang(lang: string): SpeechSynthesisVoice | undefined {
  const primary = lang.split("-")[0].toLowerCase();
  const exact = cachedVoices.filter((voice) => voice.lang.toLowerCase() === lang.toLowerCase());
  const matches = exact.length > 0 ? exact : cachedVoices.filter((voice) => voice.lang.toLowerCase().startsWith(primary));
  if (matches.length === 0) return undefined;

  // Prefer a real voice over a novelty one; only fall back to a novelty
  // voice if it's genuinely the only option for this language.
  const normal = matches.filter((voice) => !NOVELTY_VOICE_NAMES.has(voice.name));
  const pool = normal.length > 0 ? normal : matches;

  // Among normal voices, a "Google ..." network voice is consistently the
  // most natural-sounding option where available; a non-local (network)
  // voice is the next-best signal of quality when no Google voice exists.
  return (
    pool.find((voice) => voice.name.includes("Google")) ??
    pool.find((voice) => !voice.localService) ??
    pool[0]
  );
}

function buildUtterance(text: string, lang?: string): SpeechSynthesisUtterance {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1.05;
  utterance.pitch = 1.15;
  if (lang) {
    utterance.lang = lang;
    const voice = findVoiceForLang(lang);
    if (voice) utterance.voice = voice;
  }
  return utterance;
}

// `lang` is a BCP-47 code (e.g. "hi-IN") for the mascot's *guidance* — its
// own encouragement/instructions, spoken in the learner's preferred
// language, not the language they're practicing.
export function speak(text: string, lang?: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(buildUtterance(text, lang));
}

// Speaks a sentence around a fill-in-the-blank marker as a pause instead of
// reading the marker text itself — most voices otherwise read "_____" as
// literal garble ("underscore underscore...") rather than silence, which
// defeats the point of a fill-in-the-blank exercise read aloud.
export function speakWithPause(text: string, blankMarker: string, lang?: string, pauseMs = 500) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();

  const segments = text
    .split(blankMarker)
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0);

  function speakSegment(index: number) {
    if (index >= segments.length) return;
    const utterance = buildUtterance(segments[index], lang);
    utterance.onend = () => setTimeout(() => speakSegment(index + 1), pauseMs);
    window.speechSynthesis.speak(utterance);
  }

  speakSegment(0);
}

export function stopSpeaking() {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
}
