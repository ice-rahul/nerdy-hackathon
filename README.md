# LinguaBuild

A scaffolded, five-exercise language-learning web app built for the [Nerdy AI Hackathon Challenge](https://hackathon.nerdy.com/) ("Language Learning App" prompt). See `docs/plan.md` for the full design rationale.

## Structure

- `frontend/` — Next.js (App Router) + Tailwind + TypeScript. All progress is stored in `localStorage`; there is no database or auth.
- `backend/` — FastAPI service that proxies exercise-generation requests to the Anthropic API. It never accepts raw prompt text from the client — every exercise type has a fixed template in `backend/prompts.py`, and the client only sends a `exercise` kind plus typed parameters.

## Running locally

### Backend

```bash
cd backend
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # fill in ANTHROPIC_API_KEY
uvicorn main:app --reload
```

Runs on `http://localhost:8000`.

### Frontend

```bash
cd frontend
npm install
echo "NEXT_PUBLIC_SERVICE_URL=http://localhost:8000" > .env.local
npm run dev
```

Runs on `http://localhost:3000`.

## Environment variables

**Backend** (`backend/.env`):

| Variable | Required | Default | Notes |
|---|---|---|---|
| `ANTHROPIC_API_KEY` | yes | — | Never commit this. |
| `GENERATE_RATE_LIMIT` | no | `30/minute` | Per-IP limit on `/generate`. Tighten to `5/minute` (or lower) before a public deploy. |
| `CORS_ALLOWED_ORIGINS` | no | `""` | Comma-separated extra allowed origins. `localhost:3000`/`127.0.0.1:3000` are always allowed on top of this — add the deployed frontend's URL here. |

**Frontend** (`frontend/.env.local`):

| Variable | Required | Notes |
|---|---|---|
| `NEXT_PUBLIC_SERVICE_URL` | yes | Base URL of the backend (no trailing slash). The app throws a clear startup error if this is unset, rather than failing with an opaque network error. |

## Deploying

- **Backend (Render):** `backend/render.yaml` defines the service. Set `ANTHROPIC_API_KEY` as a secret in the Render dashboard, and set `CORS_ALLOWED_ORIGINS` to the deployed frontend's origin once you have it. The start command passes `--proxy-headers` so the per-IP rate limiter sees real client IPs behind Render's reverse proxy, not Render's proxy IP for every request.
- **Frontend (Vercel):** set `NEXT_PUBLIC_SERVICE_URL` to the deployed backend's URL in the Vercel project's environment variables before the first deploy.

## Security notes

- `/generate` only ever builds prompts from the fixed templates in `backend/prompts.py`; the request body is validated against a typed, per-exercise Pydantic model (allowed languages, length caps) and rejected otherwise. It is not a general-purpose LLM proxy.
- No secrets are committed; both `backend/.env` and `frontend/.env*` are gitignored. Only `.env.example` (no real values) is tracked.
- There is intentionally no auth or backend persistence — see `CLAUDE.md` for why.
