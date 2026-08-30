import os
from typing import Optional

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from dotenv import load_dotenv
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from utils import stream_json_response

load_dotenv()

app = FastAPI()

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# 5/minute (the python_chat default) is too tight for local dev, where a single
# multi-exercise page load can fire several /generate calls at once. Override
# with a stricter value via env before deploying.
GENERATE_RATE_LIMIT = os.getenv("GENERATE_RATE_LIMIT", "30/minute")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class GenerateRequest(BaseModel):
    messages: list[dict]
    system: Optional[str] = None


@app.get("/")
def health_check():
    return {"status": "ok"}


@app.post("/generate")
@limiter.limit(GENERATE_RATE_LIMIT)
async def generate(request: Request, body: GenerateRequest):
    try:
        return StreamingResponse(
            stream_json_response(body.messages, system=body.system),
            media_type="text/plain",
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
