"""Server-side prompt templates for every exercise type.

The API used to accept arbitrary `messages`/`system` from the client and pass
them straight to the Anthropic API — meaning anyone who found the endpoint
could use it as a free, unrestricted Claude proxy billed to this project's
API key. Every exercise's prompt now lives here instead: the client sends a
`exercise` kind plus a small set of typed parameters, and only these
templates ever become the text sent to the model.
"""

from typing import Literal

from pydantic import BaseModel, Field

# Mirrors frontend/lib/languages.ts's TARGET_LANGUAGE_OPTIONS /
# PREFERRED_LANGUAGE_OPTIONS — keeping the same allowlist on both sides so a
# request can't smuggle arbitrary text into the prompt via the "language"
# fields either.
DesiredLanguage = Literal["Spanish", "French", "German", "English", "Hindi"]
PreferredLanguage = Literal["English", "Hindi", "Spanish", "French"]
Difficulty = Literal[1, 2, 3]

_JSON_ONLY_SYSTEM = (
    "You are a language-learning exercise generator. Respond with a single "
    "JSON object only — no markdown, no code fences, no commentary."
)

_QUESTION_LENGTH_INSTRUCTION: dict[Difficulty, str] = {
    1: "Keep it very short and simple: ONE short sentence (no more than about "
    "8-10 words) setting up the scenario, then the question itself — do not "
    "add extra description.",
    2: "Keep it short: at most two short sentences total (including the "
    "question) — a brief scenario setup, then the question.",
    3: "You may use up to three short sentences total (including the "
    "question) for a slightly richer scenario, but keep every individual "
    "sentence short and simple.",
}

# A phrase only ever comes from the app's own fixed starter list or Exercise
# 1's scene vocabulary, but the request body is still client-controlled, so
# every free-text field gets a length cap as defense in depth against someone
# calling the endpoint directly with oversized input.
_PHRASE_MAX_LEN = 200
_TEXT_MAX_LEN = 2000


class FillBlankParams(BaseModel):
    phrase: str = Field(..., max_length=_PHRASE_MAX_LEN)
    desired_language: DesiredLanguage
    preferred_language: PreferredLanguage


class QAParams(BaseModel):
    phrase: str = Field(..., max_length=_PHRASE_MAX_LEN)
    desired_language: DesiredLanguage
    preferred_language: PreferredLanguage
    difficulty: Difficulty = 1


class GuidedQAParams(BaseModel):
    phrase: str = Field(..., max_length=_PHRASE_MAX_LEN)
    pool: list[str] = Field(..., min_length=1, max_length=20)
    desired_language: DesiredLanguage
    preferred_language: PreferredLanguage
    difficulty: Difficulty = 1


class ParagraphSummaryParams(BaseModel):
    phrases: list[str] = Field(..., min_length=1, max_length=10)
    desired_language: DesiredLanguage
    preferred_language: PreferredLanguage


class GradeParams(BaseModel):
    question: str = Field(..., max_length=_TEXT_MAX_LEN)
    expected_answer: str = Field(..., max_length=_TEXT_MAX_LEN)
    learner_answer: str = Field(..., max_length=_TEXT_MAX_LEN)
    desired_language: DesiredLanguage
    preferred_language: PreferredLanguage


def build_fill_blank_prompt(params: FillBlankParams) -> tuple[str, str]:
    desired, preferred = params.desired_language, params.preferred_language
    user = f"""Create a fill-in-the-blank exercise that teaches the {desired} phrase for "{params.phrase}" ({preferred}).

Write one natural {desired} sentence that uses this phrase, with the phrase itself replaced by a blank (use "_____" as the blank marker). Give the correct phrase that fills the blank, and exactly 3 plausible but incorrect distractor options of similar length and difficulty, in {desired}.

Respond with a JSON object with exactly these fields:
{{
  "sentence_with_blank": string,
  "correct_answer": string,
  "distractor_options": [string, string, string],
  "desired_language": "{desired}",
  "preferred_language": "{preferred}"
}}"""
    return _JSON_ONLY_SYSTEM, user


def build_qa_prompt(params: QAParams) -> tuple[str, str]:
    desired, preferred = params.desired_language, params.preferred_language
    length_instruction = _QUESTION_LENGTH_INSTRUCTION[params.difficulty]
    user = f"""Create a short-answer speaking-practice question that teaches the {desired} phrase for "{params.phrase}" ({preferred}).

Write a situational question, in {desired}, whose natural short answer is the {desired} phrase for "{params.phrase}" — describe a scenario a learner would respond to with that phrase, rather than asking for a translation directly. {length_instruction}

Also give a natural {preferred} translation of that same question — a learner who doesn't yet understand the {desired} can reveal this to check they understood correctly.

Respond with a JSON object with exactly these fields:
{{
  "question": string,
  "question_translation": string,
  "expected_answer": string,
  "desired_language": "{desired}"
}}"""
    return _JSON_ONLY_SYSTEM, user


def build_guided_qa_prompt(params: GuidedQAParams) -> tuple[str, str]:
    desired, preferred = params.desired_language, params.preferred_language
    other_phrases = ", ".join(p for p in params.pool if p != params.phrase)
    pool_list = ", ".join(params.pool)
    length_instruction = _QUESTION_LENGTH_INSTRUCTION[params.difficulty]
    user = f"""Create a situational multiple-choice question that teaches the {desired} phrase for "{params.phrase}" ({preferred}).

Write a situational question, in {desired}, describing a scenario where the {desired} phrase for "{params.phrase}" would be the natural response. {length_instruction} The question must be answerable from context alone: a learner who has only seen a small set of common words/phrases ({pool_list}) should be able to infer the right answer just from the situation described, without needing to already know any other unfamiliar {desired} vocabulary used in the question. Keep the rest of the {desired} in the question simple, using cognates or a clearly described action so the scenario is understandable to a beginner even if a word or two is unfamiliar.

Then give exactly 4 multiple-choice answer options in {preferred}: one correct option, which is the {preferred} meaning of "{params.phrase}", and 3 incorrect distractor options, each the {preferred} meaning of a different phrase from this list (do not invent new distractors): {other_phrases}.

Also give a natural {preferred} translation of the question itself — a learner who doesn't yet understand the {desired} can reveal this to check they understood the scenario correctly.

Respond with a JSON object with exactly these fields:
{{
  "question": string,
  "question_translation": string,
  "options": [
    {{ "text": string, "correct": boolean }},
    {{ "text": string, "correct": boolean }},
    {{ "text": string, "correct": boolean }},
    {{ "text": string, "correct": boolean }}
  ]
}}"""
    return _JSON_ONLY_SYSTEM, user


def build_paragraph_summary_prompt(params: ParagraphSummaryParams) -> tuple[str, str]:
    desired, preferred = params.desired_language, params.preferred_language
    phrase_list = ", ".join(params.phrases)
    user = f"""Write a short {desired} paragraph (3-4 sentences) at a beginner level, naturally using the {desired} phrases for these everyday expressions: {phrase_list}. Keep vocabulary and grammar simple enough for a beginner learner.

Then write 4 multiple-choice summary options, in {preferred}, summarizing what the paragraph is about:
- One option must be an accurate, correct summary of the paragraph.
- The 3 incorrect options must each use a DIFFERENT distractor strategy — do not repeat the same trick twice:
  1. Detail-swap: an otherwise-accurate summary that swaps one specific detail (a name, time, place, or object) for a different plausible one.
  2. Action-inversion: an otherwise-accurate summary that reverses or inverts what actually happened or was said (describes the opposite action or outcome).
  3. Partial-truth/omission: a summary that captures part of the paragraph accurately but leaves out or misrepresents a key part, making it an incomplete or misleading summary overall.

Respond with a JSON object with exactly these fields:
{{
  "paragraph": string,
  "options": [
    {{ "text": string, "correct": boolean }},
    {{ "text": string, "correct": boolean }},
    {{ "text": string, "correct": boolean }},
    {{ "text": string, "correct": boolean }}
  ]
}}"""
    return _JSON_ONLY_SYSTEM, user


_GRADE_SYSTEM = (
    "You are a lenient, encouraging language-learning grader. Respond with a "
    "single JSON object only — no markdown, no code fences, no commentary."
)


def build_grade_prompt(params: GradeParams) -> tuple[str, str]:
    desired, preferred = params.desired_language, params.preferred_language
    user = f"""A learner was asked this question in {desired}:
<question>{params.question}</question>

The expected answer is:
<expected_answer>{params.expected_answer}</expected_answer>

The learner answered:
<learner_answer>{params.learner_answer}</learner_answer>

Judge whether the learner's answer conveys the same meaning as the expected answer. Be lenient about minor spelling, accent marks, capitalization, and phrasing differences — the learner should pass if they got the meaning right, even if the wording isn't identical. Only mark it incorrect if the meaning is wrong, missing, or unrelated.

Respond with a JSON object with exactly these fields:
{{
  "correct": boolean,
  "feedback": string
}}
Write "feedback" in {preferred} — this is coaching the learner in their native language, not more {desired} practice. Keep it to one short, encouraging sentence."""
    return _GRADE_SYSTEM, user


# Maps the client's `exercise` discriminator to (params model, builder) —
# main.py uses this to validate the incoming body and build the prompt
# without ever touching a raw string the client supplied.
EXERCISE_BUILDERS: dict[str, tuple[type[BaseModel], object]] = {
    "fill_blank": (FillBlankParams, build_fill_blank_prompt),
    "qa": (QAParams, build_qa_prompt),
    "guided_qa": (GuidedQAParams, build_guided_qa_prompt),
    "paragraph_summary": (ParagraphSummaryParams, build_paragraph_summary_prompt),
    "grade": (GradeParams, build_grade_prompt),
}
