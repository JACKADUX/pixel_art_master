import {
  DEFAULT_BASE_URLS,
  DEFAULT_MODELS,
  isLlmProviderId,
  LLM_PROVIDER_IDS,
  providerRequiresApiKey,
  type LlmProviderId,
} from "./LlmProvider";
import { LlmError } from "./LlmError";

export const LLM_SETTINGS_VERSION = 2;

export const DEFAULT_LLM_TIMEOUT_MS = 60_000;
export const MIN_LLM_TIMEOUT_MS = 5_000;
export const MAX_LLM_TIMEOUT_MS = 300_000;

/** 单个供应商的连接参数 */
export interface LlmProviderConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
  timeoutMs: number;
}

/** 持久化结构：各供应商独立保存，activeProvider 指向当前选中项 */
export interface LlmSettingsStore {
  activeProvider: LlmProviderId;
  providers: Record<LlmProviderId, LlmProviderConfig>;
}

/** 解析后的当前活跃配置，供 LLM 客户端使用 */
export interface LlmSettings extends LlmProviderConfig {
  provider: LlmProviderId;
}

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

export function createDefaultProviderConfig(provider: LlmProviderId): LlmProviderConfig {
  return {
    apiKey: "",
    baseUrl: DEFAULT_BASE_URLS[provider],
    model: DEFAULT_MODELS[provider],
    timeoutMs: DEFAULT_LLM_TIMEOUT_MS,
  };
}

export function createDefaultLlmSettingsStore(): LlmSettingsStore {
  const providers = {} as Record<LlmProviderId, LlmProviderConfig>;
  for (const id of LLM_PROVIDER_IDS) {
    providers[id] = createDefaultProviderConfig(id);
  }
  return {
    activeProvider: "deepseek",
    providers,
  };
}

export const DEFAULT_LLM_SETTINGS_STORE = createDefaultLlmSettingsStore();

export const DEFAULT_LLM_SETTINGS: LlmSettings = {
  provider: "deepseek",
  ...createDefaultProviderConfig("deepseek"),
};

function parseProviderConfig(raw: unknown, provider: LlmProviderId): LlmProviderConfig {
  const defaults = createDefaultProviderConfig(provider);
  if (!isRecord(raw)) return defaults;

  const baseUrl =
    typeof raw.baseUrl === "string" && raw.baseUrl.trim()
      ? normalizeBaseUrl(raw.baseUrl)
      : defaults.baseUrl;

  const model =
    typeof raw.model === "string" && raw.model.trim() ? raw.model.trim() : defaults.model;

  return {
    apiKey: typeof raw.apiKey === "string" ? raw.apiKey : defaults.apiKey,
    baseUrl,
    model,
    timeoutMs: clampLlmTimeoutMs(
      typeof raw.timeoutMs === "number" ? raw.timeoutMs : defaults.timeoutMs,
    ),
  };
}

function isLegacyFlatFormat(raw: Record<string, unknown>): boolean {
  return typeof raw.provider === "string" && raw.providers === undefined;
}

function migrateFromLegacyFlat(raw: Record<string, unknown>): LlmSettingsStore {
  const provider = isLlmProviderId(raw.provider) ? raw.provider : "deepseek";
  const store = createDefaultLlmSettingsStore();
  store.activeProvider = provider;
  store.providers[provider] = parseProviderConfig(raw, provider);
  return store;
}

export function parseLlmSettingsStore(raw: unknown): LlmSettingsStore {
  if (!isRecord(raw)) return createDefaultLlmSettingsStore();

  if (isLegacyFlatFormat(raw)) {
    return migrateFromLegacyFlat(raw);
  }

  const activeProvider = isLlmProviderId(raw.activeProvider)
    ? raw.activeProvider
    : "deepseek";

  const store = createDefaultLlmSettingsStore();
  store.activeProvider = activeProvider;

  if (isRecord(raw.providers)) {
    for (const id of LLM_PROVIDER_IDS) {
      if (raw.providers[id] !== undefined) {
        store.providers[id] = parseProviderConfig(raw.providers[id], id);
      }
    }
  }

  return store;
}

/** @deprecated 兼容旧调用，请使用 parseLlmSettingsStore */
export function parseLlmSettings(raw: unknown): LlmSettings {
  return resolveActiveLlmSettings(parseLlmSettingsStore(raw));
}

export function resolveActiveLlmSettings(store: LlmSettingsStore): LlmSettings {
  const config = store.providers[store.activeProvider];
  return {
    provider: store.activeProvider,
    ...config,
  };
}

export function setActiveProvider(
  store: LlmSettingsStore,
  provider: LlmProviderId,
): LlmSettingsStore {
  return { ...store, activeProvider: provider };
}

export function updateProviderConfig(
  store: LlmSettingsStore,
  provider: LlmProviderId,
  partial: Partial<LlmProviderConfig>,
): LlmSettingsStore {
  const current = store.providers[provider];
  const next: LlmProviderConfig = {
    ...current,
    ...partial,
    baseUrl:
      partial.baseUrl !== undefined ? normalizeBaseUrl(partial.baseUrl) : current.baseUrl,
    model: partial.model !== undefined ? partial.model.trim() : current.model,
    timeoutMs:
      partial.timeoutMs !== undefined
        ? clampLlmTimeoutMs(partial.timeoutMs)
        : current.timeoutMs,
  };
  return {
    ...store,
    providers: { ...store.providers, [provider]: next },
  };
}

export function updateActiveProviderConfig(
  store: LlmSettingsStore,
  partial: Partial<LlmProviderConfig>,
): LlmSettingsStore {
  return updateProviderConfig(store, store.activeProvider, partial);
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
