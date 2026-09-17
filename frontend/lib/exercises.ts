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

// Every build*Prompt function below returns an `exercise` kind plus typed
// params, never prompt text — the actual template lives server-side
// (backend/prompts.py) so the client can't smuggle arbitrary instructions
// into the model call. See lib/api.ts's GenerateRequest for why.
export function buildFillBlankPrompt(
  phrase: string,
  desiredLanguage: string,
  preferredLanguage: string
): GenerateRequest {
  return {
    exercise: "fill_blank",
    params: {
      phrase,
      desired_language: desiredLanguage,
      preferred_language: preferredLanguage,
    },
  };
}

// Question length ramps up over a session rather than staying fixed at "up
// to 3 sentences" from the first question — level 1 (a learner's first
// couple of questions) is a single short sentence, so the very first thing
// a beginner sees is genuinely easy, not already at the hardest setting.
export type QuestionDifficulty = 1 | 2 | 3;

// Maps "questions answered correctly so far this session" to a difficulty
// level — the same simple threshold-based ramp used for Exercise 1's
// per-level word count (see plan.md's "level-growth-by-threshold" note).
export function difficultyForScore(score: number): QuestionDifficulty {
  if (score < 2) return 1;
  if (score < 4) return 2;
  return 3;
}

export type QAExercise = {
  question: string;
  question_translation: string;
  expected_answer: string;
  desired_language: string;
};

export function buildQAPrompt(
  phrase: string,
  desiredLanguage: string,
  preferredLanguage: string,
  difficulty: QuestionDifficulty = 1
): GenerateRequest {
  return {
    exercise: "qa",
    params: {
      phrase,
      desired_language: desiredLanguage,
      preferred_language: preferredLanguage,
      difficulty,
    },
  };
}

export type GuidedQAOption = {
  text: string;
  correct: boolean;
};

export type GuidedQAExercise = {
  question: string;
  question_translation: string;
  options: GuidedQAOption[];
};

export function buildGuidedQAPrompt(
  phrase: string,
  pool: string[],
  desiredLanguage: string,
  preferredLanguage: string,
  difficulty: QuestionDifficulty = 1
): GenerateRequest {
  return {
    exercise: "guided_qa",
    params: {
      phrase,
      pool,
      desired_language: desiredLanguage,
      preferred_language: preferredLanguage,
      difficulty,
    },
  };
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
  return {
    exercise: "paragraph_summary",
    params: {
      phrases,
      desired_language: desiredLanguage,
      preferred_language: preferredLanguage,
    },
  };
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
  preferredLanguage: string;
}): GenerateRequest {
  const { question, expectedAnswer, learnerAnswer, desiredLanguage, preferredLanguage } = params;
  return {
    exercise: "grade",
    params: {
      question,
      expected_answer: expectedAnswer,
      learner_answer: learnerAnswer,
      desired_language: desiredLanguage,
      preferred_language: preferredLanguage,
    },
  };
}
