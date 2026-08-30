from anthropic import Anthropic
from dotenv import load_dotenv
import os

load_dotenv()

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

    with client.messages.stream(**params) as stream:
        for text in stream.text_stream:
            yield text
