# LinguaBuild — Project Context for Claude Code

Full plan: see /docs/plan.md — read it before starting any work.

## What this is
A language-learning web app for the Nerdy AI Hackathon Challenge (English Reading Game pivoted to Language Learning App prompt). Deadline: Fri, Sep 18, 2026, end of day (per hackathon.nerdy.com — supersedes the Sep 9 date in docs/plan.md, which reflected an earlier extension). Judging Sep 21-23, Demo Day for finalists Sep 25.

## Stack
- Frontend: Next.js (App Router) + Tailwind + TypeScript
- Backend: FastAPI + Anthropic Claude API (streaming)
- Persistence: localStorage only for now — no database, no auth. Do not add backend persistence unless explicitly asked.
- Deploy target (later): Vercel (frontend) + Render (backend)

## Reference repos (cloned locally, not part of this project — see /reference)
- /reference/python_chat — fork the FastAPI structure from main.py...
- /reference/simple_eval_ui — frontend stack reference...
- /reference/fast-fingers — useReducer game-state pattern...

## Build order (see /docs/plan.md Section 4 for full detail)
Day 1: backend scaffold (forked from python_chat pattern) + frontend scaffold + Exercise 1 scene data
Day 2: Exercise 4 (Fill in the Blanks) first — simplest, establishes the shared generation pattern
Day 3: Exercise 2 (Q&A)
Day 4: Exercise 1 (Word Identification)
Day 5: Exercise 3 (Paragraph → MCQ)
Day 6: wire cross-exercise reinforcement + localStorage progress view
Day 7: PWA setup + responsive polish
Day 8: full run-through, bug fixing
Day 9-10: demo recording, buffer, submit

## Rules
- Don't add a database or auth unless explicitly asked — localStorage only until told otherwise.
- Don't build spaced-repetition scheduling — the design intentionally uses cross-exercise reinforcement ("immersive daily practice") instead. See /docs/plan.md Section 2 for why.
- Default to Sonnet-appropriate scope per task; flag if something looks like it needs deeper reasoning.
- Never commit .env or any API key.

## Known gotchas
- Generated `options` arrays always have the correct answer first — always shuffle client-side before rendering, never trust generation order.
- CORS allowlist in backend/main.py is localhost by default; add the prod Vercel origin via the `CORS_ALLOWED_ORIGINS` env var (comma-separated) at deploy time — no code edit needed.
- GENERATE_RATE_LIMIT is set to 30/min for dev convenience — set the env var to 5/min (or lower) before deploy. If deployed behind a reverse proxy (Render), the process must be started with uvicorn's `--proxy-headers` flag (see backend/render.yaml) or the rate limiter's per-IP keying breaks.
- `/generate`'s request body is `{exercise, params}`, never raw `messages`/`system` — every exercise's actual prompt text lives in `backend/prompts.py`'s fixed templates. Do not reintroduce a path that lets the client supply arbitrary prompt/system text; that turns the endpoint into an unrestricted, API-key-billed proxy. Adding a new exercise type means adding a template + Pydantic params model there, not accepting free-form text.