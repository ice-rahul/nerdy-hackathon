// Every exercise's actual prompt text lives server-side (backend/prompts.py)
// — the client only ever sends a fixed `exercise` kind plus typed
// parameters, never raw prompt/system text. This keeps /generate from being
// callable as an arbitrary, unrestricted proxy to the Anthropic API.
export type GenerateRequest = {
  exercise: string;
  params: Record<string, unknown>;
};

function serviceUrl(): string {
  const url = process.env.NEXT_PUBLIC_SERVICE_URL;
  if (!url) {
    // Fails loudly and immediately instead of fetch()-ing "undefined/generate"
    // and surfacing a confusing network error deep in a mutation's catch
    // handler — this is a deploy/env misconfiguration, not a runtime one.
    throw new Error(
      "NEXT_PUBLIC_SERVICE_URL is not set — the backend URL must be configured at build/deploy time."
    );
  }
  return url;
}

// Buffers the full stream before returning — correct for structured JSON output,
// where the caller needs the complete text to JSON.parse it anyway. Exercise 3's
// paragraph display will want to render text as it streams in; that should be a
// separate streaming-text variant added later, not a change to this function.
export async function generate(request: GenerateRequest): Promise<string> {
  const res = await fetch(`${serviceUrl()}/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });

  if (!res.ok || !res.body) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.detail || `HTTP error! status: ${res.status}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let fullText = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    fullText += decoder.decode(value, { stream: true });
  }

  return fullText;
}

// The model occasionally returns text that doesn't parse as JSON (a rare
// generation slip, not a code bug) — one silent retry against a fresh
// completion clears most of these without surfacing an error to the learner
// for what's ultimately a transient issue.
async function parseJsonWithRetry<T>(
  fetchText: () => Promise<string>
): Promise<T> {
  const first = await fetchText();
  try {
    return JSON.parse(first) as T;
  } catch {
    // fall through to retry
  }

  const second = await fetchText();
  try {
    return JSON.parse(second) as T;
  } catch {
    throw new Error(`Failed to parse JSON from /generate: ${second}`);
  }
}

export async function generateJson<T>(request: GenerateRequest): Promise<T> {
  return parseJsonWithRetry<T>(() => generate(request));
}

// Streaming counterpart: calls onPartial with a best-effort parse of
// whatever JSON has arrived so far, after every chunk — the object grows
// field-by-field as the model streams (e.g. a "sentence" field is often
// complete and safe to render well before a later "distractor_options"
// array has even started). Still resolves with a strict, fully-parsed T at
// the end, exactly like generateJson, so existing consumers of the final
// value (dedupe, shuffle, scoring) are unaffected — this only adds visibility
// into the in-progress text.
async function generateStreamOnce<T>(
  request: GenerateRequest,
  onPartial?: (partial: Partial<T>) => void
): Promise<string> {
  const res = await fetch(`${serviceUrl()}/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });

  if (!res.ok || !res.body) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.detail || `HTTP error! status: ${res.status}`);
  }

  const { parse: parsePartialJson } = await import("best-effort-json-parser");

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let fullText = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    fullText += decoder.decode(value, { stream: true });
    if (onPartial) {
      try {
        onPartial(parsePartialJson(fullText) as Partial<T>);
      } catch {
        // Some intermediate states (e.g. a dangling escape character) aren't
        // recoverable even best-effort — just wait for the next chunk.
      }
    }
  }

  return fullText;
}

export async function generateJsonStream<T>(
  request: GenerateRequest,
  onPartial?: (partial: Partial<T>) => void
): Promise<T> {
  return parseJsonWithRetry<T>(() => generateStreamOnce<T>(request, onPartial));
}
