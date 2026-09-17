import logging
import os

from anthropic import Anthropic
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger("linguabuild")

model = "claude-haiku-4-5"


def add_user_message(messages, text):
    messages.append({"role": "user", "content": text})


def add_assistant_message(messages, text):
    messages.append({"role": "assistant", "content": text})


def stream_json_response(messages, system=None, temperature=1.0):
    """Stream a structured JSON completion using the prefill + stop_sequences
    technique: prefill the assistant turn with ```json so the model continues
    straight into an array/object, and stop at the closing fence so no trailing
    markdown needs to be stripped from the streamed text.
    """
    client = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

    add_assistant_message(messages, "```json")

    params = {
        "model": model,
        "max_tokens": 1000,
        "messages": messages,
        "temperature": temperature,
        "stop_sequences": ["```"],
    }
    if system:
        params["system"] = system

    try:
        with client.messages.stream(**params) as stream:
            for text in stream.text_stream:
                yield text
    except Exception:
        # The HTTP response has already started (200, streaming) by the time
        # this can happen, so there's no clean way to turn this into an error
        # status — the client sees a truncated stream and fails to parse it.
        # At minimum, log server-side so a failure is visible in ops, rather
        # than disappearing silently.
        logger.exception("stream_json_response failed mid-stream")
        raise
