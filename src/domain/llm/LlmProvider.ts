export type LlmProviderId = "deepseek" | "openrouter" | "ollama" | "custom";

export const LLM_PROVIDER_IDS: readonly LlmProviderId[] = [
  "deepseek",
  "openrouter",
  "ollama",
  "custom",
] as const;

export const LLM_PROVIDER_LABELS: Record<LlmProviderId, string> = {
  deepseek: "DeepSeek",
  openrouter: "OpenRouter",
  ollama: "Ollama（本地）",
  custom: "自定义",
};

export const DEFAULT_BASE_URLS: Record<LlmProviderId, string> = {
  deepseek: "https://api.deepseek.com/v1",
  openrouter: "https://openrouter.ai/api/v1",
  ollama: "http://127.0.0.1:11434/v1",
  custom: "",
};

export const DEFAULT_MODELS: Record<LlmProviderId, string> = {
  deepseek: "deepseek-chat",
  openrouter: "deepseek/deepseek-chat",
  ollama: "llama3.2",
  custom: "",
};

/** 各供应商的默认视觉（识图）模型，供识图模式提示用户使用支持视觉的模型 */
export const DEFAULT_VISION_MODELS: Record<LlmProviderId, string> = {
  deepseek: "deepseek-chat",
  openrouter: "deepseek/deepseek-chat",
  ollama: "llava",
  custom: "",
};

export function isLlmProviderId(value: unknown): value is LlmProviderId {
  return typeof value === "string" && LLM_PROVIDER_IDS.includes(value as LlmProviderId);
}

export function providerRequiresApiKey(provider: LlmProviderId): boolean {
  return provider !== "ollama";
}
