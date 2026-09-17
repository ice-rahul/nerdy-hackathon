"use client";

import { useEffect, useReducer, useState } from "react";
import { useSession } from "@/lib/session/SessionContext";
import { useFeedback } from "@/lib/feedback/FeedbackContext";
import { ScoreBadge } from "@/components/ScoreBadge/ScoreBadge";
import { PronounceButton } from "@/components/PronounceButton/PronounceButton";
import { SceneItemImage } from "@/components/SceneItemImage/SceneItemImage";
import { TranslatableQuestion } from "@/components/TranslatableQuestion/TranslatableQuestion";
import { shuffle } from "@/lib/shuffle";
import type { SceneCategory, SceneItem } from "@/lib/scenes/types";
import {
  TARGET_LANGUAGE_LABEL_KEY,
  PREFERRED_LANGUAGE_LABEL_KEY,
  TARGET_LANGUAGE_SPEECH_CODE,
  WHAT_IS_THIS,
  CORRECT_EXCLAMATION,
  type TargetLanguage,
} from "@/lib/languages";
import { SessionNav } from "@/components/SessionNav/SessionNav";

const DISTRACTOR_COUNT = 3;

type Screen = "category" | "study" | "quiz" | "complete";

// Same MCQ shape as the other exercises' reducers (correct/incorrect
// tracking, score, shuffle) — just drawing questions from a fixed local
// category instead of an AI-generated exercise. askedIds additionally tracks
// which objects have already been correctly answered this quiz run, so the
// same object isn't re-asked until every object in the category has been
// covered at least once.
type QuizState = {
  item: SceneItem | null;
  options: SceneItem[];
  incorrectIds: string[];
  correct: boolean;
  score: number;
  askedIds: string[];
};

type QuizAction =
  | { type: "load"; item: SceneItem; options: SceneItem[] }
  | { type: "select"; optionId: string }
  | { type: "reset" };

const initialQuizState: QuizState = {
  item: null,
  options: [],
  incorrectIds: [],
  correct: false,
  score: 0,
  askedIds: [],
};

function manageQuiz(state: QuizState, action: QuizAction): QuizState {
  switch (action.type) {
    case "load":
      return {
        ...state,
        item: action.item,
        options: action.options,
        incorrectIds: [],
        correct: false,
      };
    case "select": {
      if (!state.item || state.correct) return state;
      if (action.optionId === state.item.id) {
        return {
          ...state,
          correct: true,
          score: state.score + 1,
          askedIds: [...state.askedIds, state.item.id],
        };
      }
      if (state.incorrectIds.includes(action.optionId)) return state;
      return { ...state, incorrectIds: [...state.incorrectIds, action.optionId] };
    }
    case "reset":
      return initialQuizState;
    default:
      return state;
  }
}

// Picks the next question from whichever objects haven't been asked yet this
// run — returns null once every object has been covered, signaling the quiz
// is complete rather than silently cycling back to a random repeat.
function pickQuestion(
  objects: SceneItem[],
  askedIds: string[]
): { item: SceneItem; options: SceneItem[] } | null {
  const remaining = objects.filter((o) => !askedIds.includes(o.id));
  if (remaining.length === 0) return null;

  const item = remaining[Math.floor(Math.random() * remaining.length)];
  const distractors = shuffle(objects.filter((o) => o.id !== item.id)).slice(
    0,
    DISTRACTOR_COUNT
  );
  const options = shuffle([item, ...distractors]);
  return { item, options };
}

export function Exercise1({ categories }: { categories: SceneCategory[] }) {
  const [screen, setScreen] = useState<Screen>("category");
  const [category, setCategory] = useState<SceneCategory | null>(null);
  const [quiz, dispatch] = useReducer(manageQuiz, initialQuizState);
  const { startSession, recordScore, targetLanguage, preferredLanguage } = useSession();
  const fx = useFeedback();

  const targetKey = TARGET_LANGUAGE_LABEL_KEY[targetLanguage as TargetLanguage] ?? "es";
  const preferredKey = PREFERRED_LANGUAGE_LABEL_KEY[preferredLanguage ?? ""] ?? "en";
  const targetSpeechLang =
    TARGET_LANGUAGE_SPEECH_CODE[targetLanguage as TargetLanguage] ?? "es-ES";
  const whatIsThis =
    WHAT_IS_THIS[targetLanguage as TargetLanguage] ?? WHAT_IS_THIS.Spanish;
  // WHAT_IS_THIS already covers English/Hindi/Spanish/French (plus German) —
  // exactly PREFERRED_LANGUAGE_OPTIONS' set — so the same table doubles as
  // the "what is this?" translation for whichever language the learner
  // actually understands, no separate table needed.
  const whatIsThisTranslation =
    WHAT_IS_THIS[preferredLanguage as TargetLanguage] ?? WHAT_IS_THIS.English;
  const correctExclamation =
    CORRECT_EXCLAMATION[targetLanguage as TargetLanguage] ?? CORRECT_EXCLAMATION.Spanish;

  useEffect(() => {
    recordScore("word-identification", quiz.score);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quiz.score]);

  useEffect(() => {
    if (quiz.correct) fx.celebrate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quiz.correct]);

  useEffect(() => {
    if (quiz.incorrectIds.length > 0) fx.stumble();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quiz.incorrectIds.length]);

  useEffect(() => {
    if (screen === "complete") fx.levelUp();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen]);

  useEffect(() => {
    if (!quiz.correct || !category) return;
    const timer = setTimeout(() => {
      const next = pickQuestion(category.objects, quiz.askedIds);
      if (next) {
        dispatch({ type: "load", ...next });
      } else {
        setScreen("complete");
      }
    }, 900);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quiz.correct]);

  function handleSelectCategory(selected: SceneCategory) {
    setCategory(selected);
    // Picking a category sets the session's active vocabulary — the same
    // words then reappear across Exercises 2-5 via the reinforcement badge.
    startSession(selected.objects.map((object) => object.label.en));
    setScreen("study");
  }

  function handleStartQuiz() {
    if (!category) return;
    dispatch({ type: "reset" });
    const next = pickQuestion(category.objects, []);
    if (next) dispatch({ type: "load", ...next });
    setScreen("quiz");
  }

  if (screen === "category") {
    return (
      <div className="flex w-full max-w-2xl flex-col items-center gap-6">
        <h1 className="font-display text-2xl font-bold text-ink">
          Word Identification
        </h1>
        <p className="font-body font-semibold text-ink/70">
          Pick a category to explore
        </p>

        <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2">
          {categories.map((cat) => (
            <button
              key={cat.categoryId}
              onClick={() => handleSelectCategory(cat)}
              className="sticker-panel flex flex-col items-center gap-3 border-quest p-6 transition-transform hover:-translate-y-1 hover:shadow-sticker-lg"
            >
              <div className="grid grid-cols-3 gap-1">
                {cat.objects.slice(0, 3).map((object) => (
                  <SceneItemImage
                    key={object.id}
                    item={object}
                    size={48}
                    sizes="48px"
                    emojiTextClass="text-3xl"
                  />
                ))}
              </div>
              <span className="font-display text-xl font-bold text-ink">
                {cat.categoryName[preferredKey]}
              </span>
              <span className="font-body text-sm font-semibold text-ink/70">
                {cat.objects.length} words
              </span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (screen === "study" && category) {
    return (
      <div className="flex w-full max-w-2xl flex-col items-center gap-6">
        <div className="flex w-full items-center">
          <button onClick={() => setScreen("category")} className="btn-ghost">
            ← Categories
          </button>
        </div>

        <h1 className="font-display text-2xl font-bold text-ink">
          {category.categoryName[preferredKey]}
        </h1>
        <p className="font-body font-semibold text-ink/70">
          Study these words, then start the quiz.
        </p>

        <div className="grid w-full grid-cols-2 gap-4 sm:grid-cols-3">
          {category.objects.map((object) => (
            <div
              key={object.id}
              className="sticker-panel flex flex-col items-center gap-2 p-4 relative"
            >
              <SceneItemImage item={object} size={80} sizes="80px" emojiTextClass="text-5xl" />
              <span className="flex items-center gap-1.5 font-display text-base font-bold text-ink">
                {object.label[targetKey]}
                <PronounceButton text={object.label[targetKey]} lang={targetSpeechLang} />
              </span>
              <span className="font-body text-sm font-semibold text-ink/60">
                {object.label[preferredKey]}
              </span>
            </div>
          ))}
        </div>

        <button onClick={handleStartQuiz} className="btn-quest">
          Start Quiz →
        </button>
      </div>
    );
  }

  if (screen === "quiz" && category && quiz.item) {
    return (
      <div className="flex w-full max-w-lg flex-col items-center gap-6">
        <div className="flex w-full items-center justify-between">
          <button onClick={() => setScreen("study")} className="btn-ghost">
            ← Study
          </button>
          <ScoreBadge score={quiz.score} />
        </div>

        <h1 className="font-display text-2xl font-bold text-ink">
          {category.categoryName[preferredKey]} Quiz
        </h1>

        <div className="sticker-panel flex flex-col items-center gap-4 p-6">
          <SceneItemImage item={quiz.item} size={96} sizes="96px" emojiTextClass="text-6xl" />
          <TranslatableQuestion
            key={quiz.item.id}
            question={whatIsThis}
            translation={whatIsThisTranslation}
            lang={targetSpeechLang}
            bare
            summaryClassName="font-display text-lg font-bold text-ink"
            minHeightClass=""
          />
        </div>

        <div className="grid w-full grid-cols-2 gap-3">
          {quiz.options.map((option) => {
            const isCorrectChoice = quiz.correct && option.id === quiz.item!.id;
            const isWrongChoice = quiz.incorrectIds.includes(option.id);
            const disabled = quiz.correct || isWrongChoice;

            return (
              <button
                key={option.id}
                disabled={disabled}
                onClick={() => dispatch({ type: "select", optionId: option.id })}
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
                {option.label[targetKey]}
              </button>
            );
          })}
        </div>

        {quiz.correct && <p className="feedback-correct">{correctExclamation}</p>}
      </div>
    );
  }

  if (screen === "complete" && category) {
    const otherCategory = categories.find((c) => c.categoryId !== category.categoryId);

    return (
      <div className="flex w-full max-w-lg flex-col items-center gap-6">
        <div className="sticker-panel w-full border-treasure bg-treasure/20 p-6 text-center">
          <p className="font-display text-2xl font-bold text-ink">
            {category.categoryName[preferredKey]} complete! 🎉
          </p>
          <p className="badge-score mt-3 inline-flex">
            🏅 Score: {quiz.score} / {category.objects.length}
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3">
          {otherCategory && (
            <button
              onClick={() => handleSelectCategory(otherCategory)}
              className="btn-explorer"
            >
              Try {otherCategory.categoryName[preferredKey]} →
            </button>
          )}
          <SessionNav current="word-identification" />
        </div>
      </div>
    );
  }

  return null;
}
