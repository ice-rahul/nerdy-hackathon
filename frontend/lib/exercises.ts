import type { GenerateRequest } from "@/lib/api";
import { shuffle } from "@/lib/shuffle";

// Starter vocabulary only — Day 6 wires this to the shared active-vocabulary-set
// coming out of Exercise 1, per /docs/plan.md Section 4.
export const STARTER_PHRASES = [
  "thank you",
  "good morning",
  "sorry",
  "please",
  "goodbye",
  "excuse me",
];

export function pickRandomPhrase(pool: string[] = STARTER_PHRASES): string {
  return pool[Math.floor(Math.random() * pool.length)];
}

export function pickRandomPhrases(count: number, pool: string[] = STARTER_PHRASES): string[] {
  return shuffle(pool).slice(0, count);
}

export type FillBlankExercise = {
  sentence_with_blank: string;
  correct_answer: string;
  distractor_options: string[];
  desired_language: string;
  preferred_language: string;
};

export function buildFillBlankPrompt(
  phrase: string,
  desiredLanguage: string,
  preferredLanguage: string
): GenerateRequest {
  const system =
    "You are a language-learning exercise generator. Respond with a single JSON object only — no markdown, no code fences, no commentary.";

  const user = `Create a fill-in-the-blank exercise that teaches the ${desiredLanguage} phrase for "${phrase}" (${preferredLanguage}).

Write one natural ${desiredLanguage} sentence that uses this phrase, with the phrase itself replaced by a blank (use "_____" as the blank marker). Give the correct phrase that fills the blank, and exactly 3 plausible but incorrect distractor options of similar length and difficulty, in ${desiredLanguage}.

Respond with a JSON object with exactly these fields:
{
  "sentence_with_blank": string,
  "correct_answer": string,
  "distractor_options": [string, string, string],
  "desired_language": "${desiredLanguage}",
  "preferred_language": "${preferredLanguage}"
}`;

  return { system, messages: [{ role: "user", content: user }] };
}

export type QAExercise = {
  question: string;
  expected_answer: string;
  desired_language: string;
};

export function buildQAPrompt(
  phrase: string,
  desiredLanguage: string,
  preferredLanguage: string
): GenerateRequest {
  const system =
    "You are a language-learning exercise generator. Respond with a single JSON object only — no markdown, no code fences, no commentary.";

  const user = `Create a short-answer speaking-practice question that teaches the ${desiredLanguage} phrase for "${phrase}" (${preferredLanguage}).

Write one simple situational question, in ${desiredLanguage}, whose natural short answer is the ${desiredLanguage} phrase for "${phrase}" — describe a scenario a learner would respond to with that phrase, rather than asking for a translation directly.

Respond with a JSON object with exactly these fields:
{
  "question": string,
  "expected_answer": string,
  "desired_language": "${desiredLanguage}"
}`;

  return { system, messages: [{ role: "user", content: user }] };
}

export type GuidedQAOption = {
  text: string;
  correct: boolean;
};

export type GuidedQAExercise = {
  question: string;
  options: GuidedQAOption[];
};

export function buildGuidedQAPrompt(
  phrase: string,
  pool: string[],
  desiredLanguage: string,
  preferredLanguage: string
): GenerateRequest {
  const system =
    "You are a language-learning exercise generator. Respond with a single JSON object only — no markdown, no code fences, no commentary.";

  const otherPhrases = pool.filter((p) => p !== phrase).join(", ");

  const user = `Create a situational multiple-choice question that teaches the ${desiredLanguage} phrase for "${phrase}" (${preferredLanguage}).

Write one simple situational question, in ${desiredLanguage}, describing a scenario where the ${desiredLanguage} phrase for "${phrase}" would be the natural response. The question must be answerable from context alone: a learner who has only seen a small set of common words/phrases (${pool.join(
    ", "
  )}) should be able to infer the right answer just from the situation described, without needing to already know any other unfamiliar ${desiredLanguage} vocabulary used in the question. Keep the rest of the ${desiredLanguage} in the question simple, using cognates or a clearly described action so the scenario is understandable to a beginner even if a word or two is unfamiliar.

Then give exactly 4 multiple-choice answer options in ${preferredLanguage}: one correct option, which is the ${preferredLanguage} meaning of "${phrase}", and 3 incorrect distractor options, each the ${preferredLanguage} meaning of a different phrase from this list (do not invent new distractors): ${otherPhrases}.

Respond with a JSON object with exactly these fields:
{
  "question": string,
  "options": [
    { "text": string, "correct": boolean },
    { "text": string, "correct": boolean },
    { "text": string, "correct": boolean },
    { "text": string, "correct": boolean }
  ]
}`;

  return { system, messages: [{ role: "user", content: user }] };
}

export type ParagraphSummaryOption = {
  text: string;
  correct: boolean;
};

export type ParagraphSummaryExercise = {
  paragraph: string;
  options: ParagraphSummaryOption[];
};

export function buildParagraphSummaryPrompt(
  phrases: string[],
  desiredLanguage: string,
  preferredLanguage: string
): GenerateRequest {
  const system =
    "You are a language-learning exercise generator. Respond with a single JSON object only — no markdown, no code fences, no commentary.";

  const phraseList = phrases.join(", ");

  const user = `Write a short ${desiredLanguage} paragraph (3-4 sentences) at a beginner level, naturally using the ${desiredLanguage} phrases for these everyday expressions: ${phraseList}. Keep vocabulary and grammar simple enough for a beginner learner.

Then write 4 multiple-choice summary options, in ${preferredLanguage}, summarizing what the paragraph is about:
- One option must be an accurate, correct summary of the paragraph.
- The 3 incorrect options must each use a DIFFERENT distractor strategy — do not repeat the same trick twice:
  1. Detail-swap: an otherwise-accurate summary that swaps one specific detail (a name, time, place, or object) for a different plausible one.
  2. Action-inversion: an otherwise-accurate summary that reverses or inverts what actually happened or was said (describes the opposite action or outcome).
  3. Partial-truth/omission: a summary that captures part of the paragraph accurately but leaves out or misrepresents a key part, making it an incomplete or misleading summary overall.

Respond with a JSON object with exactly these fields:
{
  "paragraph": string,
  "options": [
    { "text": string, "correct": boolean },
    { "text": string, "correct": boolean },
    { "text": string, "correct": boolean },
    { "text": string, "correct": boolean }
  ]
}`;

  return { system, messages: [{ role: "user", content: user }] };
}

export type GradeVerdict = {
  correct: boolean;
  feedback: string;
};

export function buildGradingPrompt(params: {
  question: string;
  expectedAnswer: string;
  learnerAnswer: string;
  desiredLanguage: string;
}): GenerateRequest {
  const { question, expectedAnswer, learnerAnswer, desiredLanguage } = params;

  const system =
    "You are a lenient, encouraging language-learning grader. Respond with a single JSON object only — no markdown, no code fences, no commentary.";

  const user = `A learner was asked this question in ${desiredLanguage}:
<question>${question}</question>

The expected answer is:
<expected_answer>${expectedAnswer}</expected_answer>

The learner answered:
<learner_answer>${learnerAnswer}</learner_answer>

Judge whether the learner's answer conveys the same meaning as the expected answer. Be lenient about minor spelling, accent marks, capitalization, and phrasing differences — the learner should pass if they got the meaning right, even if the wording isn't identical. Only mark it incorrect if the meaning is wrong, missing, or unrelated.

Respond with a JSON object with exactly these fields:
{
  "correct": boolean,
  "feedback": string
}
Keep feedback to one short, encouraging sentence.`;

  return { system, messages: [{ role: "user", content: user }] };
}
