import type { Settings } from "./types.ts";

const STORAGE_KEY = "blueprint-reader.settings";

export const DEFAULT_MODEL = "grok-4";
export const DEFAULT_BASE_URL = "https://api.x.ai/v1";

export const defaultSettings = (): Settings => ({
  apiKey: "",
  model: DEFAULT_MODEL,
  baseUrl: DEFAULT_BASE_URL,
});

export function loadSettings(): Settings {
  if (typeof localStorage === "undefined") return defaultSettings();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultSettings();
    const parsed = JSON.parse(raw) as Partial<Settings>;
    return {
      apiKey: typeof parsed.apiKey === "string" ? parsed.apiKey : "",
      model:
        typeof parsed.model === "string" && parsed.model.trim()
          ? parsed.model.trim()
          : DEFAULT_MODEL,
      baseUrl:
        typeof parsed.baseUrl === "string" && parsed.baseUrl.trim()
          ? parsed.baseUrl.trim().replace(/\/+$/, "")
          : DEFAULT_BASE_URL,
    };
  } catch {
    return defaultSettings();
  }
}

export function saveSettings(settings: Settings) {
  const next: Settings = {
    apiKey: settings.apiKey,
    model: settings.model.trim() || DEFAULT_MODEL,
    baseUrl: (settings.baseUrl.trim() || DEFAULT_BASE_URL).replace(/\/+$/, ""),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}
