import {
  DEFAULT_BASE_URLS,
  DEFAULT_MODELS,
  isLlmProviderId,
  providerRequiresApiKey,
  type LlmProviderId,
} from "./LlmProvider";
import { LlmError } from "./LlmError";

export const LLM_SETTINGS_VERSION = 1;

export const DEFAULT_LLM_TIMEOUT_MS = 60_000;
export const MIN_LLM_TIMEOUT_MS = 5_000;
export const MAX_LLM_TIMEOUT_MS = 300_000;

export interface LlmSettings {
  provider: LlmProviderId;
  apiKey: string;
  baseUrl: string;
  model: string;
  timeoutMs: number;
}

export const DEFAULT_LLM_SETTINGS: LlmSettings = {
  provider: "deepseek",
  apiKey: "",
  baseUrl: DEFAULT_BASE_URLS.deepseek,
  model: DEFAULT_MODELS.deepseek,
  timeoutMs: DEFAULT_LLM_TIMEOUT_MS,
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function clampNumber(value: number, min: number, max: number, fallback: number): number {
  if (!Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, value));
}

export function clampLlmTimeoutMs(value: number): number {
  return clampNumber(value, MIN_LLM_TIMEOUT_MS, MAX_LLM_TIMEOUT_MS, DEFAULT_LLM_TIMEOUT_MS);
}

export function normalizeBaseUrl(url: string): string {
  return url.trim().replace(/\/+$/, "");
}

export function resolveChatCompletionsUrl(settings: LlmSettings): string {
  const base = normalizeBaseUrl(settings.baseUrl);
  if (!base) {
    throw new LlmError("config", "Base URL 未配置");
  }
  return `${base}/chat/completions`;
}

export function validateLlmSettings(settings: LlmSettings): void {
  if (!settings.model.trim()) {
    throw new LlmError("config", "请配置模型名称");
  }
  if (!settings.baseUrl.trim()) {
    throw new LlmError("config", "请配置 Base URL");
  }
  if (providerRequiresApiKey(settings.provider) && !settings.apiKey.trim()) {
    throw new LlmError("config", "请配置 API Key");
  }
}

export function parseLlmSettings(raw: unknown): LlmSettings {
  const defaults = DEFAULT_LLM_SETTINGS;
  if (!isRecord(raw)) return { ...defaults };

  const provider = isLlmProviderId(raw.provider) ? raw.provider : defaults.provider;

  const baseUrl =
    typeof raw.baseUrl === "string" && raw.baseUrl.trim()
      ? normalizeBaseUrl(raw.baseUrl)
      : DEFAULT_BASE_URLS[provider];

  const model =
    typeof raw.model === "string" && raw.model.trim()
      ? raw.model.trim()
      : DEFAULT_MODELS[provider];

  return {
    provider,
    apiKey: typeof raw.apiKey === "string" ? raw.apiKey : defaults.apiKey,
    baseUrl,
    model,
    timeoutMs: clampLlmTimeoutMs(
      typeof raw.timeoutMs === "number" ? raw.timeoutMs : defaults.timeoutMs,
    ),
  };
}

export function withLlmProvider(settings: LlmSettings, provider: LlmProviderId): LlmSettings {
  const previousDefault = DEFAULT_BASE_URLS[settings.provider];
  const baseUrl =
    !settings.baseUrl || settings.baseUrl === previousDefault
      ? DEFAULT_BASE_URLS[provider]
      : settings.baseUrl;

  const previousModel = DEFAULT_MODELS[settings.provider];
  const model =
    !settings.model || settings.model === previousModel ? DEFAULT_MODELS[provider] : settings.model;

  return {
    ...settings,
    provider,
    baseUrl,
    model,
    apiKey: provider === "ollama" ? "" : settings.apiKey,
  };
}
