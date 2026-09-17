"use client";

import { useEffect, useReducer, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { generateJsonStream } from "@/lib/api";
import { dedupeByKey, shuffle } from "@/lib/shuffle";
import {
  buildParagraphSummaryPrompt,
  pickRandomPhrases,
  type ParagraphSummaryExercise,
  type ParagraphSummaryOption,
} from "@/lib/exercises";
import { useSession } from "@/lib/session/SessionContext";
import { useFeedback } from "@/lib/feedback/FeedbackContext";
import { ReinforcementBadge } from "@/components/ReinforcementBadge/ReinforcementBadge";
import { ScoreBadge } from "@/components/ScoreBadge/ScoreBadge";
import { StreamingText } from "@/components/StreamingText/StreamingText";
import { OptionsSkeleton } from "@/components/OptionsSkeleton/OptionsSkeleton";
import { PronounceButton } from "@/components/PronounceButton/PronounceButton";
import { SessionNav } from "@/components/SessionNav/SessionNav";
import { TARGET_LANGUAGE_SPEECH_CODE, type TargetLanguage } from "@/lib/languages";

const NEXT_EXERCISE_DELAY_MS = 900;
const PHRASES_PER_PARAGRAPH = 3;

// Fetch status (loading/error) lives in useMutation — this reducer only owns
// game logic derived from a loaded exercise: selection, score, wrong-answer
// tracking, plus which active-set phrases this paragraph was generated from
// (for the reinforcement badge).
type GameState = {
  exercise: ParagraphSummaryExercise | null;
  phrases: string[];
  options: ParagraphSummaryOption[];
  incorrect: string[];
  correct: boolean;
  score: number;
};

type GameAction =
  | { type: "exercise_loaded"; exercise: ParagraphSummaryExercise; phrases: string[] }
  | { type: "select"; option: ParagraphSummaryOption }
  | { type: "reset" };

const initialState: GameState = {
  exercise: null,
  phrases: [],
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
        phrases: action.phrases,
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

export function ParagraphSummary() {
  const [state, dispatch] = useReducer(manageGame, initialState);
  const [streamingParagraph, setStreamingParagraph] = useState("");
  const { activeVocabulary, sessionStarted, recordScore, hydrated, preferredLanguage, targetLanguage } =
    useSession();
  const fx = useFeedback();
  const targetSpeechLang =
    TARGET_LANGUAGE_SPEECH_CODE[targetLanguage as TargetLanguage] ?? "es-ES";

  useEffect(() => {
    recordScore("paragraph-summary", state.score);
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
      setStreamingParagraph("");
      const phrases = pickRandomPhrases(PHRASES_PER_PARAGRAPH, activeVocabulary);
      return generateJsonStream<ParagraphSummaryExercise>(
        buildParagraphSummaryPrompt(phrases, targetLanguage!, preferredLanguage!),
        (partial) => setStreamingParagraph(partial.paragraph ?? "")
      ).then((exercise) => ({ exercise, phrases }));
    },
    onSuccess: ({ exercise, phrases }) =>
      dispatch({ type: "exercise_loaded", exercise, phrases }),
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
          Paragraph Summary
        </h1>
        <ScoreBadge score={state.score} />
      </div>

      {isLoading && (
        <>
          <StreamingText text={streamingParagraph} align="left" minHeightClass="min-h-48" />
          <div className="grid w-full grid-cols-1 gap-3">
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
          {sessionStarted && state.phrases.length > 0 && (
            <ReinforcementBadge words={state.phrases} />
          )}

          <p className="sticker-panel relative min-h-48 w-full p-6 pr-14 text-left font-body text-lg font-bold text-ink">
            {state.exercise.paragraph}
            <PronounceButton text={state.exercise.paragraph} lang={targetSpeechLang} />
          </p>

          <div className="grid w-full grid-cols-1 gap-3">
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
        <SessionNav current="paragraph-summary" />
      </div>
    </div>
  );
}
