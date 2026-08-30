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
