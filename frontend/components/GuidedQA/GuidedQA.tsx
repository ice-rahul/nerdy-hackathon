"use client";

import { useEffect, useReducer, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { generateJsonStream } from "@/lib/api";
import { dedupeByKey, shuffle } from "@/lib/shuffle";
import {
  buildGuidedQAPrompt,
  difficultyForScore,
  pickRandomPhrase,
  type GuidedQAExercise,
  type GuidedQAOption,
} from "@/lib/exercises";
import { useSession } from "@/lib/session/SessionContext";
import { useFeedback } from "@/lib/feedback/FeedbackContext";
import { ReinforcementBadge } from "@/components/ReinforcementBadge/ReinforcementBadge";
import { ScoreBadge } from "@/components/ScoreBadge/ScoreBadge";
import { StreamingText } from "@/components/StreamingText/StreamingText";
import { OptionsSkeleton } from "@/components/OptionsSkeleton/OptionsSkeleton";
import { TranslatableQuestion } from "@/components/TranslatableQuestion/TranslatableQuestion";
import { SessionNav } from "@/components/SessionNav/SessionNav";
import { TARGET_LANGUAGE_SPEECH_CODE, type TargetLanguage } from "@/lib/languages";

const NEXT_EXERCISE_DELAY_MS = 900;

// Fetch status (loading/error) lives in useMutation — this reducer only owns
// game logic derived from a loaded exercise: selection, score, wrong-answer
// tracking, plus which active-set phrase this exercise was generated from
// (for the reinforcement badge).
type GameState = {
  exercise: GuidedQAExercise | null;
  phrase: string | null;
  options: GuidedQAOption[];
  incorrect: string[];
  correct: boolean;
  score: number;
};

type GameAction =
  | { type: "exercise_loaded"; exercise: GuidedQAExercise; phrase: string }
  | { type: "select"; option: GuidedQAOption }
  | { type: "reset" };

const initialState: GameState = {
  exercise: null,
  phrase: null,
  options: [],
  incorrect: [],
  correct: false,
  score: 0,
};

function manageGame(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "exercise_loaded":
      return {
        ...state,
        exercise: action.exercise,
        phrase: action.phrase,
        options: shuffle(
          dedupeByKey(
            action.exercise.options,
            (option) => option.text,
            (option) => option.correct
          )
        ),
        incorrect: [],
        correct: false,
      };
    case "select": {
      if (state.correct || !state.exercise) return state;
      if (action.option.correct) {
        return { ...state, correct: true, score: state.score + 1 };
      }
      if (state.incorrect.includes(action.option.text)) return state;
      return { ...state, incorrect: [...state.incorrect, action.option.text] };
    }
    case "reset":
      return initialState;
    default:
      return state;
  }
}

export function GuidedQA() {
  const [state, dispatch] = useReducer(manageGame, initialState);
  const [streamingQuestion, setStreamingQuestion] = useState("");
  const { activeVocabulary, sessionStarted, recordScore, hydrated, preferredLanguage, targetLanguage } =
    useSession();
  const fx = useFeedback();
  const targetSpeechLang =
    TARGET_LANGUAGE_SPEECH_CODE[targetLanguage as TargetLanguage] ?? "es-ES";

  useEffect(() => {
    recordScore("qa", state.score);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.score]);

  useEffect(() => {
    if (state.correct) fx.celebrate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.correct]);

  useEffect(() => {
    if (state.incorrect.length > 0) fx.stumble();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.incorrect.length]);

  const {
    mutate: loadExercise,
    status: fetchStatus,
    error: fetchError,
  } = useMutation({
    mutationFn: () => {
      setStreamingQuestion("");
      const phrase = pickRandomPhrase(activeVocabulary);
      return generateJsonStream<GuidedQAExercise>(
        buildGuidedQAPrompt(
          phrase,
          activeVocabulary,
          targetLanguage!,
          preferredLanguage!,
          difficultyForScore(state.score)
        ),
        (partial) => setStreamingQuestion(partial.question ?? "")
      ).then((exercise) => ({ exercise, phrase }));
    },
    onSuccess: ({ exercise, phrase }) =>
      dispatch({ type: "exercise_loaded", exercise, phrase }),
  });

  useEffect(() => {
    if (!hydrated) return;
    loadExercise();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);

  useEffect(() => {
    if (!state.correct) return;
    const timer = setTimeout(loadExercise, NEXT_EXERCISE_DELAY_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.correct]);

  const isLoading = fetchStatus === "pending" && !state.exercise;
  const isError = fetchStatus === "error" && !state.exercise;

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-lg">
      <div className="flex w-full items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-ink">
          Guided Q&amp;A
        </h1>
        <ScoreBadge score={state.score} />
      </div>

      {isLoading && (
        <>
          <StreamingText text={streamingQuestion} />
          <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2">
            <OptionsSkeleton count={4} />
          </div>
        </>
      )}

      {isError && (
        <p className="feedback-error max-w-md">
          Error:{" "}
          {fetchError instanceof Error
            ? fetchError.message
            : "Failed to load exercise"}
        </p>
      )}

      {state.exercise && (
        <>
          {sessionStarted && state.phrase && (
            <ReinforcementBadge words={[state.phrase]} />
          )}

          <TranslatableQuestion
            key={state.exercise.question}
            question={state.exercise.question}
            translation={state.exercise.question_translation}
            lang={targetSpeechLang}
          />

          <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2">
            {state.options.map((option) => {
              const isCorrectChoice = state.correct && option.correct;
              const isWrongChoice = state.incorrect.includes(option.text);
              const disabled = state.correct || isWrongChoice;

              return (
                <button
                  key={option.text}
                  disabled={disabled}
                  onClick={() => dispatch({ type: "select", option })}
                  className={[
                    "option-btn",
                    isCorrectChoice
                      ? "option-btn-correct"
                      : isWrongChoice
                        ? "option-btn-incorrect"
                        : "",
                    disabled && !isCorrectChoice ? "option-btn-neutral-disabled" : "",
                  ].join(" ")}
                >
                  {option.text}
                </button>
              );
            })}
          </div>

          {state.correct && fetchStatus !== "error" && (
            <p className="feedback-correct">Correct! Next exercise...</p>
          )}

          {state.correct && fetchStatus === "error" && (
            <div className="flex flex-col items-center gap-2">
              <p className="feedback-correct">Correct!</p>
              <p className="feedback-error max-w-md">
                Couldn&apos;t load the next exercise:{" "}
                {fetchError instanceof Error ? fetchError.message : "please try again"}
              </p>
              <button onClick={() => loadExercise()} className="btn-quest">
                Try again
              </button>
            </div>
          )}
        </>
      )}

      <div className="flex w-full justify-end">
        <SessionNav current="qa" />
      </div>
    </div>
  );
}
