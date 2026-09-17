export type ChatMessage = { role: "user" | "assistant"; content: string };

export type GenerateRequest = {
  messages: ChatMessage[];
  system?: string;
};

// Buffers the full stream before returning — correct for structured JSON output,
// where the caller needs the complete text to JSON.parse it anyway. Exercise 3's
// paragraph display will want to render text as it streams in; that should be a
// separate streaming-text variant added later, not a change to this function.
export async function generate(request: GenerateRequest): Promise<string> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_SERVICE_URL}/generate`, {
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

export async function generateJson<T>(request: GenerateRequest): Promise<T> {
  const text = await generate(request);
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(`Failed to parse JSON from /generate: ${text}`);
  }
}

// Streaming counterpart: calls onPartial with a best-effort parse of
// whatever JSON has arrived so far, after every chunk — the object grows
// field-by-field as the model streams (e.g. a "sentence" field is often
// complete and safe to render well before a later "distractor_options"
// array has even started). Still resolves with a strict, fully-parsed T at
// the end, exactly like generateJson, so existing consumers of the final
// value (dedupe, shuffle, scoring) are unaffected — this only adds visibility
// into the in-progress text.
export async function generateJsonStream<T>(
  request: GenerateRequest,
  onPartial?: (partial: Partial<T>) => void
): Promise<T> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_SERVICE_URL}/generate`, {
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

  try {
    return JSON.parse(fullText) as T;
  } catch {
    throw new Error(`Failed to parse JSON from /generate: ${fullText}`);
  }
}
