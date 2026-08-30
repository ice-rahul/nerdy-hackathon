export type ExerciseKey =
  | "word-identification"
  | "qa"
  | "paragraph-summary"
  | "fill-in-the-blank"
  | "free-response";

export const EXERCISE_ORDER: {
  key: ExerciseKey;
  path: string;
  label: string;
  optional?: boolean;
}[] = [
  { key: "word-identification", path: "/exercises/word-identification", label: "Word Identification" },
  { key: "qa", path: "/exercises/qa", label: "Guided Q&A" },
  { key: "paragraph-summary", path: "/exercises/paragraph-summary", label: "Paragraph Summary" },
  { key: "fill-in-the-blank", path: "/exercises/fill-in-the-blank", label: "Fill in the Blanks" },
  { key: "free-response", path: "/exercises/free-response", label: "Moment of Truth", optional: true },
];

export function getNextExercise(current: ExerciseKey) {
  const index = EXERCISE_ORDER.findIndex((exercise) => exercise.key === current);
  return EXERCISE_ORDER[index + 1] ?? null;
}
