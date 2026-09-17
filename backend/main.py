import logging
import os

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, ValidationError
from dotenv import load_dotenv
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from prompts import EXERCISE_BUILDERS
from utils import stream_json_response

load_dotenv()

logger = logging.getLogger("linguabuild")

app = FastAPI()

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# 5/minute (the python_chat default) is too tight for local dev, where a single
# multi-exercise page load can fire several /generate calls at once. Override
# with a stricter value via env before deploying.
GENERATE_RATE_LIMIT = os.getenv("GENERATE_RATE_LIMIT", "30/minute")

# Comma-separated list of extra allowed origins (the prod Vercel origin,
# say) — set via env at deploy time instead of editing this file. Localhost
# is always allowed so local dev keeps working regardless of this var.
_extra_origins = [
    origin.strip()
    for origin in os.getenv("CORS_ALLOWED_ORIGINS", "").split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", *_extra_origins],
    allow_methods=["*"],
    allow_headers=["*"],
)


class GenerateRequest(BaseModel):
    # `exercise` selects one of prompts.EXERCISE_BUILDERS' fixed templates —
    # the client sends typed parameters, never a raw prompt. This is what
    # keeps /generate from being an open, unrestricted proxy to the Anthropic
    # API billed to this project's key: the actual system/user text sent to
    # the model always comes from prompts.py, never from the request body.
    exercise: str
    params: dict


@app.get("/")
def health_check():
    return {"status": "ok"}


@app.post("/generate")
@limiter.limit(GENERATE_RATE_LIMIT)
async def generate(request: Request, body: GenerateRequest):
    builder_entry = EXERCISE_BUILDERS.get(body.exercise)
    if builder_entry is None:
        raise HTTPException(status_code=400, detail=f"Unknown exercise: {body.exercise}")

    params_model, build_prompt = builder_entry
    try:
        params = params_model(**body.params)
    except ValidationError as e:
        raise HTTPException(status_code=422, detail=str(e))

    system, user = build_prompt(params)
    messages = [{"role": "user", "content": user}]

    try:
        return StreamingResponse(
            stream_json_response(messages, system=system),
            media_type="text/plain",
        )
    except Exception:
        # Never echo the raw exception back to the client — it can leak
        # internal details (library errors, paths). Log it server-side and
        # return a generic message instead.
        logger.exception("generate failed for exercise=%s", body.exercise)
        raise HTTPException(status_code=500, detail="Failed to generate exercise")
