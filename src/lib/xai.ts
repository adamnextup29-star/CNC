import type { Settings } from "./types.ts";

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === "AbortError";
}

function endpoint(settings: Settings, path: string): string {
  const base = (settings.baseUrl || "https://api.x.ai/v1").replace(/\/+$/, "");
  return `${base}${path}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

async function errorMessage(res: Response): Promise<string> {
  const text = await res.text();
  try {
    const data = JSON.parse(text) as { error?: { message?: string } | string; message?: string };
    if (typeof data.error === "string") return data.error;
    if (isRecord(data.error) && typeof data.error.message === "string") return data.error.message;
    if (typeof data.message === "string") return data.message;
  } catch {
    /* use the raw body */
  }
  return text.slice(0, 500) || res.statusText;
}

export function explainFailure(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 401 || error.status === 403) {
      return "xAI rejected the API key. Open Settings and paste a key from console.x.ai.";
    }
    if (error.status === 429) return "xAI rate limit. Wait a moment, then retry.";
    if (error.status === 413) {
      return "Those images were too large for the API. Try fewer pages or a tighter photo.";
    }
    return `xAI request failed (${error.status}): ${error.message}`;
  }
  if (error instanceof Error) {
    if (/failed to fetch|networkerror|load failed/i.test(error.message)) {
      return "The browser could not reach api.x.ai. Check the connection and try again.";
    }
    return error.message;
  }
  return "Something went wrong while reading the print.";
}

async function postJson(url: string, apiKey: string, body: unknown, signal?: AbortSignal): Promise<unknown> {
  const response = await fetch(url, {
    method: "POST",
    signal,
    headers: {
      Authorization: `Bearer ${apiKey.trim()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new ApiError(response.status, await errorMessage(response));
  return response.json();
}

export function imageMessage(text: string, dataUrls: string[]) {
  return {
    role: "user" as const,
    content: [
      ...dataUrls.map((url) => ({
        type: "image_url" as const,
        image_url: { url, detail: "high" as const },
      })),
      { type: "text" as const, text },
    ],
  };
}

export async function chatJson(
  settings: Settings,
  messages: unknown[],
  signal?: AbortSignal,
): Promise<string> {
  const model = settings.model.trim() || "grok-4";
  const url = endpoint(settings, "/chat/completions");
  try {
    return await readChat(
      await postJson(
        url,
        settings.apiKey,
        { model, temperature: 0, response_format: { type: "json_object" }, messages },
        signal,
      ),
    );
  } catch (error) {
    if (
      error instanceof ApiError &&
      error.status === 400 &&
      /response_format|json_object|temperature/i.test(error.message)
    ) {
      return readChat(await postJson(url, settings.apiKey, { model, messages }, signal));
    }
    throw error;
  }
}

function readChat(data: unknown): string {
  if (!isRecord(data) || !Array.isArray(data.choices)) {
    throw new Error("The model returned an empty read.");
  }
  const choice = data.choices[0];
  if (!isRecord(choice) || !isRecord(choice.message)) {
    throw new Error("The model returned an empty read.");
  }
  const content = choice.message.content;
  if (typeof content !== "string" || !content.trim()) {
    throw new Error("The model returned an empty read.");
  }
  return content;
}

export interface SearchResult {
  text: string;
  citations: string[];
}

export async function respondWithSearch(
  settings: Settings,
  prompt: string,
  signal?: AbortSignal,
): Promise<SearchResult> {
  const model = settings.model.trim() || "grok-4";
  const url = endpoint(settings, "/responses");
  const input = [{ role: "user", content: prompt }];
  try {
    return readResponse(
      await postJson(
        url,
        settings.apiKey,
        {
          model,
          input,
          tools: [
            {
              type: "web_search",
              filters: { allowed_domains: ["mcmaster.com", "mscdirect.com", "haastooling.com"] },
            },
          ],
        },
        signal,
      ),
    );
  } catch (error) {
    if (error instanceof ApiError && error.status === 400) {
      return readResponse(
        await postJson(url, settings.apiKey, { model, input, tools: [{ type: "web_search" }] }, signal),
      );
    }
    throw error;
  }
}

function readResponse(data: unknown): SearchResult {
  const text = responseText(data);
  if (!text.trim()) throw new Error("Catalog search returned no text.");
  return { text, citations: collectCitations(data) };
}

function responseText(data: unknown): string {
  if (!isRecord(data)) return "";
  if (typeof data.output_text === "string" && data.output_text.trim()) return data.output_text;
  const chunks: string[] = [];
  for (const item of Array.isArray(data.output) ? data.output : []) {
    if (!isRecord(item) || !Array.isArray(item.content)) continue;
    for (const block of item.content) {
      if (isRecord(block) && block.type === "output_text" && typeof block.text === "string") {
        chunks.push(block.text);
      }
    }
  }
  return chunks.join("\n");
}

function collectCitations(data: unknown): string[] {
  const found: string[] = [];
  if (!isRecord(data)) return found;
  if (Array.isArray(data.citations)) {
    for (const citation of data.citations) {
      if (typeof citation === "string") found.push(citation);
      else if (isRecord(citation) && typeof citation.url === "string") found.push(citation.url);
    }
  }
  for (const item of Array.isArray(data.output) ? data.output : []) {
    if (!isRecord(item)) continue;
    const action = isRecord(item.action) ? item.action : null;
    for (const source of action && Array.isArray(action.sources) ? action.sources : []) {
      if (typeof source === "string") found.push(source);
      else if (isRecord(source) && typeof source.url === "string") found.push(source.url);
    }
    for (const block of Array.isArray(item.content) ? item.content : []) {
      if (!isRecord(block) || !Array.isArray(block.annotations)) continue;
      for (const annotation of block.annotations) {
        if (isRecord(annotation) && typeof annotation.url === "string") found.push(annotation.url);
      }
    }
  }
  return [...new Set(found)];
}
