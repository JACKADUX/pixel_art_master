import { describe, expect, it } from "vitest";
import {
  clampLlmTimeoutMs,
  createDefaultLlmSettingsStore,
  DEFAULT_LLM_SETTINGS,
  parseLlmSettingsStore,
  resolveActiveLlmSettings,
  setActiveProvider,
  updateActiveProviderConfig,
  updateProviderConfig,
} from "./LlmSettings";

describe("parseLlmSettingsStore", () => {
  it("returns defaults for invalid input", () => {
    const store = parseLlmSettingsStore(null);
    expect(store.activeProvider).toBe("deepseek");
    expect(resolveActiveLlmSettings(store)).toEqual(DEFAULT_LLM_SETTINGS);
  });

  it("parses v2 per-provider store", () => {
    const parsed = parseLlmSettingsStore({
      version: 2,
      activeProvider: "openrouter",
      providers: {
        deepseek: {
          apiKey: "sk-deepseek",
          baseUrl: "https://api.deepseek.com/v1",
          model: "deepseek-chat",
          timeoutMs: 60_000,
        },
        openrouter: {
          apiKey: "sk-or",
          baseUrl: "https://openrouter.ai/api/v1/",
          model: "anthropic/claude-3.5-sonnet",
          timeoutMs: 30_000,
        },
      },
    });

    expect(parsed.activeProvider).toBe("openrouter");
    expect(parsed.providers.deepseek.apiKey).toBe("sk-deepseek");
    expect(parsed.providers.openrouter.apiKey).toBe("sk-or");
    expect(parsed.providers.openrouter.baseUrl).toBe("https://openrouter.ai/api/v1");
    expect(parsed.providers.openrouter.model).toBe("anthropic/claude-3.5-sonnet");
    expect(parsed.providers.openrouter.timeoutMs).toBe(30_000);

    const active = resolveActiveLlmSettings(parsed);
    expect(active.provider).toBe("openrouter");
    expect(active.apiKey).toBe("sk-or");
  });

  it("migrates legacy flat v1 format into per-provider store", () => {
    const parsed = parseLlmSettingsStore({
      version: 1,
      provider: "deepseek",
      apiKey: "sk-legacy",
      baseUrl: "https://api.deepseek.com/v1",
      model: "deepseek-chat",
      timeoutMs: 45_000,
    });

    expect(parsed.activeProvider).toBe("deepseek");
    expect(parsed.providers.deepseek.apiKey).toBe("sk-legacy");
    expect(parsed.providers.deepseek.timeoutMs).toBe(45_000);
    expect(parsed.providers.openrouter.apiKey).toBe("");
  });

  it("clamps timeout per provider", () => {
    const parsed = parseLlmSettingsStore({
      activeProvider: "ollama",
      providers: { ollama: { timeoutMs: 1_000 } },
    });
    expect(parsed.providers.ollama.timeoutMs).toBe(5_000);
  });

  it("falls back to provider defaults for missing fields", () => {
    const parsed = parseLlmSettingsStore({ activeProvider: "ollama" });
    expect(parsed.providers.ollama.baseUrl).toBe("http://127.0.0.1:11434/v1");
    expect(parsed.providers.ollama.model).toBe("llama3.2");
  });
});

describe("clampLlmTimeoutMs", () => {
  it("clamps to valid range", () => {
    expect(clampLlmTimeoutMs(1)).toBe(5_000);
    expect(clampLlmTimeoutMs(60_000)).toBe(60_000);
    expect(clampLlmTimeoutMs(Number.NaN)).toBe(60_000);
  });
});

describe("provider switching preserves independent configs", () => {
  it("switching active provider does not overwrite other provider configs", () => {
    let store = createDefaultLlmSettingsStore();
    store = updateProviderConfig(store, "deepseek", {
      apiKey: "sk-ds",
      model: "deepseek-chat",
    });
    store = updateProviderConfig(store, "openrouter", {
      apiKey: "sk-or",
      model: "anthropic/claude-3.5-sonnet",
    });

    store = setActiveProvider(store, "openrouter");
    expect(resolveActiveLlmSettings(store).apiKey).toBe("sk-or");

    store = setActiveProvider(store, "deepseek");
    expect(resolveActiveLlmSettings(store).apiKey).toBe("sk-ds");
    expect(store.providers.openrouter.apiKey).toBe("sk-or");
  });

  it("updateActiveProviderConfig only touches active provider", () => {
    let store = createDefaultLlmSettingsStore();
    store = updateProviderConfig(store, "openrouter", { apiKey: "sk-or" });
    store = updateActiveProviderConfig(store, { apiKey: "sk-ds-new" });

    expect(store.providers.deepseek.apiKey).toBe("sk-ds-new");
    expect(store.providers.openrouter.apiKey).toBe("sk-or");
  });
});
