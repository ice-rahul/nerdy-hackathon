"use client";

import { useEffect, useReducer, useState, type FormEvent } from "react";
import { useMutation } from "@tanstack/react-query";
import { generateJson } from "@/lib/api";
import {
  buildQAPrompt,
  buildGradingPrompt,
  pickRandomPhrase,
  type QAExercise,
  type GradeVerdict,
} from "@/lib/exercises";
import { useSession } from "@/lib/session/SessionContext";
import { ReinforcementBadge } from "@/components/ReinforcementBadge/ReinforcementBadge";
import { SessionNav } from "@/components/SessionNav/SessionNav";

const NEXT_QUESTION_DELAY_MS = 1200;

// Fetch/grading status (loading/error) lives in useMutation — this reducer only
// owns local game state: the current question, what was submitted, the grading
// verdict, score, and which active-set phrase this question came from (for the
// reinforcement badge).
type GameState = {
  question: QAExercise | null;
  phrase: string | null;
  submittedAnswer: string | null;
  verdict: GradeVerdict | null;
  score: number;
};

type GameAction =
  | { type: "question_loaded"; question: QAExercise; phrase: string }
  | { type: "answer_submitted"; answer: string }
  | { type: "graded"; verdict: GradeVerdict }
  | { type: "retry" }
  | { type: "reset" };

const initialState: GameState = {
  question: null,
  phrase: null,
  submittedAnswer: null,
  verdict: null,
  score: 0,
};

function manageGame(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "question_loaded":
      return {
        ...state,
        question: action.question,
        phrase: action.phrase,
        submittedAnswer: null,
        verdict: null,
      };
    case "answer_submitted":
      return { ...state, submittedAnswer: action.answer, verdict: null };
    case "graded":
      return {
        ...state,
        verdict: action.verdict,
        score: action.verdict.correct ? state.score + 1 : state.score,
      };
    case "retry":
      return { ...state, submittedAnswer: null, verdict: null };
    case "reset":
      return initialState;
    default:
      return state;
  }
}

export function FreeResponse() {
  const [state, dispatch] = useReducer(manageGame, initialState);
  const [answerInput, setAnswerInput] = useState("");
  const { activeVocabulary, sessionStarted, recordScore, hydrated, preferredLanguage, targetLanguage } =
    useSession();

  useEffect(() => {
    recordScore("free-response", state.score);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.score]);

  const {
    mutate: loadQuestion,
    status: questionStatus,
    error: questionError,
  } = useMutation({
    mutationFn: () => {
      const phrase = pickRandomPhrase(activeVocabulary);
      return generateJson<QAExercise>(
        buildQAPrompt(phrase, targetLanguage!, preferredLanguage!)
      ).then((question) => ({
        question,
        phrase,
      }));
    },
    onSuccess: ({ question, phrase }) => {
      dispatch({ type: "question_loaded", question, phrase });
      setAnswerInput("");
    },
  });

  const {
    mutate: gradeAnswer,
    status: gradeStatus,
    error: gradeError,
  } = useMutation({
    mutationFn: (answer: string) => {
      const question = state.question;
      if (!question) throw new Error("No question loaded");
      return generateJson<GradeVerdict>(
        buildGradingPrompt({
          question: question.question,
          expectedAnswer: question.expected_answer,
          learnerAnswer: answer,
          desiredLanguage: question.desired_language,
        })
      );
    },
    onSuccess: (verdict) => dispatch({ type: "graded", verdict }),
  });

  useEffect(() => {
    if (!hydrated) return;
    loadQuestion();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);

  useEffect(() => {
    if (!state.verdict?.correct) return;
    const timer = setTimeout(loadQuestion, NEXT_QUESTION_DELAY_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.verdict]);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmed = answerInput.trim();
    if (!trimmed || gradeStatus === "pending") return;
    dispatch({ type: "answer_submitted", answer: trimmed });
    gradeAnswer(trimmed);
  }

  function handleRetry() {
    dispatch({ type: "retry" });
    setAnswerInput("");
  }

  const isLoadingQuestion = questionStatus === "pending" && !state.question;
  const isQuestionError = questionStatus === "error" && !state.question;
  const isGrading = gradeStatus === "pending";
  const isCorrect = state.verdict?.correct === true;
  const isIncorrect = state.verdict !== null && !state.verdict.correct;

  return (
    <div className="flex w-full max-w-lg flex-col items-center gap-6">
      <div className="flex w-full items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-ink">
          Moment of Truth
        </h1>
        <span className="badge-score">🏅 Score: {state.score}</span>
      </div>

      {isLoadingQuestion && (
        <p className="font-body font-semibold text-ink/70">Loading question...</p>
      )}

      {isQuestionError && (
        <p className="feedback-error max-w-md">
          Error:{" "}
          {questionError instanceof Error
            ? questionError.message
            : "Failed to load question"}
        </p>
      )}

      {state.question && (
        <>
          {sessionStarted && state.phrase && (
            <ReinforcementBadge words={[state.phrase]} />
          )}

          <p className="sticker-panel w-full p-6 text-center font-body text-lg font-bold text-ink">
            {state.question.question}
          </p>

          <form onSubmit={handleSubmit} className="flex w-full flex-col gap-3">
            <input
              type="text"
              value={answerInput}
              onChange={(event) => setAnswerInput(event.target.value)}
              disabled={isGrading || isCorrect}
              placeholder={`Answer in ${state.question.desired_language}...`}
              className="w-full rounded-2xl border-4 border-ink bg-white px-4 py-3 font-body text-lg font-bold text-ink shadow-sticker-sm focus:outline-none disabled:opacity-70"
            />
            <button
              type="submit"
              disabled={isGrading || isCorrect || !answerInput.trim()}
              className="btn-quest"
            >
              {isGrading ? "Checking..." : "Submit"}
            </button>
          </form>

          {gradeStatus === "error" && (
            <p className="feedback-error max-w-md">
              Error grading answer:{" "}
              {gradeError instanceof Error ? gradeError.message : "Please try again"}
            </p>
          )}

          {isCorrect && (
            <p className="feedback-correct">
              Correct! {state.verdict?.feedback} Next question...
            </p>
          )}

          {isIncorrect && (
            <div className="feedback-incorrect w-full">
              <p>{state.verdict?.feedback}</p>
              <button onClick={handleRetry} className="btn-ghost self-start">
                Try again
              </button>
            </div>
          )}
        </>
      )}

      <div className="flex w-full justify-end">
        <SessionNav current="free-response" />
      </div>
    </div>
  );
}
