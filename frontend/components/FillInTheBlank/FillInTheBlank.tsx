"use client";

import { useEffect, useReducer, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { generateJsonStream } from "@/lib/api";
import { dedupeByKey, shuffle } from "@/lib/shuffle";
import {
  buildFillBlankPrompt,
  pickRandomPhrase,
  type FillBlankExercise,
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

// Fetch status (loading/error) lives in useMutation — this reducer only owns
// game logic derived from a loaded exercise: selection, score, wrong-answer
// tracking, plus which active-set phrase this exercise was generated from
// (for the reinforcement badge).
type GameState = {
  exercise: FillBlankExercise | null;
  phrase: string | null;
  options: string[];
  incorrect: string[];
  correct: boolean;
  score: number;
};

type GameAction =
  | { type: "exercise_loaded"; exercise: FillBlankExercise; phrase: string }
  | { type: "select"; option: string }
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
            [action.exercise.correct_answer, ...action.exercise.distractor_options],
            (option) => option
          )
        ),
        incorrect: [],
        correct: false,
      };
    case "select": {
      if (state.correct || !state.exercise) return state;
      if (action.option === state.exercise.correct_answer) {
        return { ...state, correct: true, score: state.score + 1 };
      }
      if (state.incorrect.includes(action.option)) return state;
      return { ...state, incorrect: [...state.incorrect, action.option] };
    }
    case "reset":
      return initialState;
    default:
      return state;
  }
}

export function FillInTheBlank() {
  const [state, dispatch] = useReducer(manageGame, initialState);
  const [streamingSentence, setStreamingSentence] = useState("");
  const { activeVocabulary, sessionStarted, recordScore, hydrated, preferredLanguage, targetLanguage } =
    useSession();
  const fx = useFeedback();
  const targetSpeechLang =
    TARGET_LANGUAGE_SPEECH_CODE[targetLanguage as TargetLanguage] ?? "es-ES";

  useEffect(() => {
    recordScore("fill-in-the-blank", state.score);
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
      setStreamingSentence("");
      const phrase = pickRandomPhrase(activeVocabulary);
      return generateJsonStream<FillBlankExercise>(
        buildFillBlankPrompt(phrase, targetLanguage!, preferredLanguage!),
        (partial) => setStreamingSentence(partial.sentence_with_blank ?? "")
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
          Fill in the Blank
        </h1>
        <ScoreBadge score={state.score} />
      </div>

      {isLoading && (
        <>
          <StreamingText text={streamingSentence} />
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

          <p className="sticker-panel relative w-full p-6 pr-14 text-center font-body text-lg font-bold text-ink">
            {state.exercise.sentence_with_blank}
            <PronounceButton
              text={state.exercise.sentence_with_blank}
              lang={targetSpeechLang}
              blankMarker="_____"
            />
          </p>

          <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2">
            {state.options.map((option) => {
              const isCorrectChoice =
                state.correct && option === state.exercise!.correct_answer;
              const isWrongChoice = state.incorrect.includes(option);
              const disabled = state.correct || isWrongChoice;

              return (
                <button
                  key={option}
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
                  {option}
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
        <SessionNav current="fill-in-the-blank" />
      </div>
    </div>
  );
}
