# LinguaBuild — Nerdy AI Hackathon Challenge Plan (Language Learning App)

**Contest:** Nerdy AI Hackathon Challenge (hackathon.nerdy.com)
**Submission deadline:** Monday, Sep 7, 2026, 11:59 PM CDT
**Prompt chosen:** Language Learning App
**Status:** This plan replaces the earlier StoryPath (English Reading Game) direction — no code was written under that plan, so nothing is lost by switching, only planning time.
**Prepared:** Aug 2026

---

## 1. Objective

Same underlying goal as before: build and submit a working AI-powered learning tool to the Nerdy AI Hackathon Challenge to get on the radar of Nerdy's AI Product Engineering hiring team, via their build-and-demo format (no resume, no interview — judged on what's shipped).

**What's at stake:** unchanged from the original plan — cash prizes ($10K/$5K), a guaranteed conversation with Nerdy's team for finalists, visibility toward AI Product Engineer roles (India comp band ~₹1 Cr for senior roles, not guaranteed), and a portfolio-worthy build regardless of outcome.

**Contest mechanics:** unchanged — 2-3 minute demo video + project link, AI-assisted scoring + engineering panel review, Demo Day Sep 11 for finalists.

---

## 2. Why This Direction

### The published prompt
> **Language Learning App** — Create a structured, user-friendly mobile experience that simplifies the acquisition of a new language through spaced repetition or immersive daily practice.
> We're looking for: a strong grasp of pedagogical design, with a seamless and intuitive user journey.

### Why this over English Reading Game
- Demonstrates broader pedagogical range in one submission — four distinct exercise types spanning recognition, production, comprehension, and recall, versus a single core loop.
- Less likely to overlap with what other entrants build — "AI reading companion" is a fairly obvious interpretation of its prompt; this scaffolded four-exercise design is more distinctive.
- Genuine trade-off, stated plainly: this is **more scope** in the same time window, not a smaller or safer build. The decision to switch was made accepting that trade.

### The core pedagogical idea: a scaffolded curriculum, not four separate games
Each vocabulary word is introduced once (Exercise 1) and then **reinforced across three further contexts** — production (Exercise 2), reading comprehension (Exercise 3), and recall (Exercise 4) — rather than taught once and abandoned. This is a real, established language-pedagogy pattern (spiral/scaffolded curriculum), and it's the throughline that makes four exercises feel like one coherent system instead of four disconnected mini-games.

### How this answers "spaced repetition or immersive daily practice"
The prompt offers these as an explicit **either/or**, not a requirement to build both. Two mechanisms were considered:
- **True spaced repetition** (interval-based resurfacing — a word comes back in 2 days because that's when you're about to forget it) requires a due-date scheduler per vocabulary item, tracking `last_seen`, `correct_streak`, and `next_due_date`. This is a genuinely separate system from level progression — it depends on time passing between sessions, which a single-sitting demo can't naturally showcase, and is unscoped in the current design.
- **Immersive daily practice** — the chosen answer. The scaffolded, cross-exercise reinforcement design (same word met four times, in four contexts, within a session) is a direct, honest instance of this half of the prompt. No separate scheduler needed; the mechanism the pedagogy already relies on *is* the answer.

**Decision: build for "immersive daily practice," not spaced repetition.** This was chosen deliberately over stretching the level/scoring system into an unconvincing spaced-repetition claim — the prompt gives explicit permission to answer either half, and this is the honest, better-supported one given the design already in place.

### How "mobile experience" is being answered
The prompt says "mobile experience" explicitly (unlike the reading prompt, which just said "application"). A plain responsive web app is a partial answer to this wording, not a full one. Decision: **build responsive-by-default, and add PWA (Progressive Web App) support** — manifest + service worker for home-screen installability and basic offline capability — during polish. This closes most of the gap between "website" and "app" for a small, well-understood cost, without the scope of a full React Native build (which was considered and rejected for the same speed-to-demo reasoning used in the original plan).

### Why exercise 1's data can be pre-built rather than generated at runtime
Object-identification scenes (Exercise 1) use predefined images, hand-placed hotspot coordinates, and a static per-object translation table — generated with AI assistance during the build, not live in the product. This avoids the much harder problems of runtime scene generation or object detection, which wouldn't have added pedagogical value anyway. Worth being precise in the demo narration: this exercise is "AI-assisted in the build process," not "AI-powered at runtime" — that distinction matters for a technical review panel. The live-AI story is carried by Exercises 2 and 3 instead.

### Why scope discipline still applies, more than before
With four exercise types in the same ~10-12 day window (now estimated 8-9 days core, see Section 4), the risk of shipping something broad-but-rough is higher than it was for the single-loop StoryPath plan. The same principle holds: a reviewer rewards something that works cleanly end-to-end over something ambitious with weak spots. Where StoryPath had one clear centerpiece (the adaptive difficulty engine), this plan's centerpiece is the **scaffolded reinforcement design itself** — so exercise polish and the cross-exercise word-linking logic matter more here than any single flashy feature.

---

## 3. Features Planned

### The five-step difficulty ramp (finalized design)
Revised from the original four-exercise plan into a clearer pedagogical scaffold — each step is a distinct skill, increasing in difficulty: **recognition → guided comprehension → larger-context comprehension → guided production → free production.** This progression is itself a stronger answer to the prompt's "strong grasp of pedagogical design" criterion than four loosely-related exercises would have been, and is worth narrating explicitly in the demo.

### Exercise 1 — Word Identification (recognition)
- A predefined scene (e.g., a kitchen table, a room) with several objects placed via absolute positioning (CSS `top`/`left` percentages or a canvas layer), z-indexed to allow natural overlap.
- Learner clicks an object → gets a multiple-choice prompt to identify it, options in the desired language, with the preferred-language meaning available as a hint/reveal.
- Level 1 starts with ~5 words per scene; each subsequent level adds one more word (reusing the same threshold-based level-growth mechanic used across the earlier reading-app design).
- Content (scenes, hotspot coordinates, translation tables) is authored ahead of time, AI-assisted during build, not generated live.

### Exercise 2 — Guided Q&A (guided comprehension)
- Short, functional day-to-day phrases (Hello, Good morning, How are you?, I am fine, Thank you, Sorry, etc.), starting basic and increasing in complexity.
- A situational question generated in the **desired language**, with 4 answer options in the **preferred language** (1 correct, 3 plausible distractors) — tests whether the learner can understand a question posed in the language they're learning, using vocabulary already introduced in Exercise 1.
- Same mechanic as Exercise 4 (MCQ, shuffle client-side before rendering), AI-generated at runtime via the structured-JSON-output technique.

### Exercise 3 — Paragraph → MCQ Summary (larger-context comprehension)
- Short-to-longer paragraphs written in the desired language, built from vocabulary already covered.
- Multiple-choice summary options (1 correct, 3 incorrect) presented in the preferred language — the step up from single-question comprehension (Exercise 2) to full-paragraph comprehension.
- AI-generated at runtime; same structured-output approach as Exercise 2.

### Exercise 4 — Fill in the Blanks (guided production)
- Statements with a blank, using vocabulary from the same reinforcement set.
- Options presented in the **desired language** (the language being learned) — the first step asking the learner to actively use the target language, rather than just recognize it via preferred-language options.
- Already built and verified working: natural sentence generation, well-chosen plausible distractors, client-side shuffle fix applied, fetch state correctly driven by React Query.

### Exercise 5 — "Moment of Truth" (free production, optional/time-permitting)
- Open-ended question in the desired language; learner types their own answer rather than selecting from options — the hardest step, testing active production rather than recognition.
- Graded via LLM-as-judge (patterned after `python_chat`'s `grade_output()`), lenient on spelling/phrasing so minor variation doesn't unfairly fail a learner who conveyed the right meaning.
- Already built and verified working — kept as-is, repositioned as the optional 5th/hardest step rather than Exercise 2's original slot.
- Explicitly the first exercise to cut if time runs short, per the "cut before quality slips" discipline used throughout this plan.

### The reinforcement mechanism (the centerpiece)
Each session's exercises 2 through 5 pull from the same word set introduced in that session's Exercise 1 — implemented as a shared "active vocabulary set" passed into each exercise's generation prompt, not independently-designed content pools. This is what makes the exercises read as one coherent pedagogical system in the demo, and it should be built and demonstrated explicitly (e.g., visually highlighting "you're about to see 'thank you' again" when it resurfaces) rather than left implicit.

### Mobile / PWA
- Responsive layout throughout (required baseline, not optional).
- PWA manifest + service worker added during polish for home-screen installability and basic offline access — the practical answer to the prompt's explicit "mobile experience" wording without the cost of a native build.

### Progress view
- Completed levels, words learned count, and a session summary — `localStorage`-based, consistent with the persistence decision below. This is a retrospective view, not the reinforcement mechanism itself (the two are related but distinct, as clarified earlier).

### Data persistence strategy
Same decision as the original plan: **`localStorage` first**, no backend database for user progress. Core focus stays on the four core exercises (1-4) and the reinforcement design; backend persistence (and anything cross-user, like a leaderboard) is deferred and only attempted if there's time left after the core is solid.

### Explicitly out of scope
- True interval-based spaced repetition (explicitly decided against — see Section 2)
- Native mobile build (React Native/Expo) — PWA chosen instead
- Accounts/auth, leaderboard (same reasoning as the original plan — cross-user features need backend persistence, which is itself deferred)
- Runtime scene generation or object detection for Exercise 1

---

## 4. Implementation Plan

**Timeline note:** the original StoryPath plan estimated ~7-8 days for a single core loop at 7-8 hrs/day. This plan has four exercise types plus PWA work — realistically **8-9 days core-only**, not 5, at the same daily pace. If "full days" means a longer working day (10-12 hrs), 6-7 days becomes plausible, but that's a harder pace to hold without quality slipping, especially on Exercise 1's asset work and Exercise 3's paragraph generation, both new problem shapes. This plan targets a realistic pace; finishing early just means more polish time, not a missed date.

**Status update:** the exercise order shifted during build — Fill in the Blanks (Exercise 4) and a Q&A variant were built first to establish the shared generation pattern, then the Q&A design was refined into its final two-exercise form (guided MCQ as Exercise 2, free-response as optional Exercise 5). Table below reflects actual progress.

| Day | Focus | Status |
|---|---|---|
| 1 | Fork `python_chat`'s `main.py` as the backend scaffold. Scaffold Next.js + Tailwind frontend, verified end-to-end. CORS tightened from wildcard to explicit localhost allowlist (prod origin still needs adding at deploy time). | **Done** |
| 2 | Build Exercise 4 (Fill in the Blanks) — mechanically simplest, established the shared generation-and-scoring pattern. `useReducer` scoped to game-logic only, fetch state driven directly by React Query (fixed after an initial version duplicated fetch state in the reducer). | **Done** |
| 3 | Build Exercise 5 (Free Response) — originally built as "Exercise 2," repositioned as the optional 5th/hardest step. LLM-as-judge grading via `grade_output()` pattern, verified lenient on phrasing/spelling. | **Done** (renamed/repositioned) |
| 3b | Build Exercise 2 (Guided Q&A) — MCQ variant, question in desired language, options in preferred language. Same pattern as Exercise 4. | **Next up** |
| 4 | Build Exercise 1 (Word Identification) — scene rendering, hotspot click handling, MCQ overlay, level-growth mechanic (reused threshold logic). |
| 5 | Build Exercise 3 (Paragraph → MCQ Summary) — the most novel generation task, budget extra prompt-iteration time here. |
| 6 | Wire the full reinforcement flow end-to-end: one session moving a learner through Exercises 1-4 (and 5 if time allows) on the same active vocabulary set, with the resurfacing moment made visible in the UI. Build the `localStorage`-based progress view. |
| 7 | PWA setup (manifest, service worker, install prompt, basic offline shell) + responsive polish pass. Consider `best-effort-json-parser` for Exercise 3's paragraph display if time allows (streaming text reveal). |
| 8 | Full end-to-end run-through, bug fixing, visual/UX polish. **Checkpoint: if behind here, cut Exercise 5 (Free Response) first — it's explicitly the optional step — before cutting any of Exercises 1-4 or PWA polish.** |
| 9 | Record demo video: problem (30s) → walk through the five-step ramp, showing a word resurface across exercises (100s) → what's next (30s). Buffer for re-takes. |
| 10 | Buffer, repo cleanup, submission form, submit early rather than at the deadline. |

---

## 5. Possible Reusability

Same audited codebase as the original plan — findings below re-mapped to this design.

### From `python_chat` + `simple_eval_ui` (strongest reuse candidate, as before)
- `main.py`'s FastAPI + CORS + `slowapi` rate limiting + streaming scaffold — same direct fork as originally planned.
- The prefill (`` ```json ``) + `stop_sequences=["```"]` structured-output technique — now the shared pattern across **three** exercises (2, 3, 4) rather than one core loop, making this reuse find more valuable here, not less.
- `grade_output()`'s LLM-as-judge pattern — applicable to Exercise 2's short-answer grading (checking a free-form answer against an expected phrase is a better fit for judged grading than exact-string matching) and potentially Exercise 3's summary-selection reasoning.
- `generate_dataset()`'s concurrent generation via `ThreadPoolExecutor` — useful if pre-generating a batch of Exercise 2/3/4 content ahead of a session rather than generating one-at-a-time.
- Next.js 16 App Router + TanStack Query shape from `simple_eval_ui` — same frontend stack, four exercise "modes" fit naturally as routed pages sharing the active-vocabulary-set context.

### From Fast Fingers
- The `useReducer` game-state-machine pattern — applicable to Exercise 1's click/select/advance flow and Exercise 4's blank-fill/submit/advance flow.
- The level-growth-by-threshold mechanic (flat increment per success, level changes on crossing a bucket) — reused directly for Exercise 1's "one more word per level" progression.
- Per-character/word highlight-on-correctness pattern — reusable for Exercise 4's fill-in-the-blank feedback.

### From Questions AI
- `withRetry` backoff wrapper — same reuse as before, portable to any of the three AI-generation exercises.
- Structured markdown-output pattern — a fallback option if the JSON-prefill technique proves awkward for any specific exercise's output shape (e.g., Exercise 3's four-option MCQ may be easier as clearly labeled markdown than nested JSON — worth testing both).

### From Khandelwal ERP
- Not previously listed as a donor for the reading-app plan, but relevant here: the event-sourced, offline-first architecture experience is directly applicable to the PWA's offline-shell design, even at a much smaller scale than that project's full offline-first system.

### Newly needed (no direct donor in existing repos)
- Exercise 1's scene/hotspot data structure and rendering — genuinely new; no existing project has an analogous "clickable positioned objects over an image" pattern to port.
- The active-vocabulary-set sharing mechanism across exercises — new, since it's specific to this scaffolded-curriculum design.