import { describe, expect, it } from "vitest";
import {
  clampLlmTimeoutMs,
  DEFAULT_LLM_SETTINGS,
  parseLlmSettings,
  withLlmProvider,
} from "./LlmSettings";

describe("parseLlmSettings", () => {
  it("returns defaults for invalid input", () => {
    expect(parseLlmSettings(null)).toEqual(DEFAULT_LLM_SETTINGS);
    expect(parseLlmSettings("bad")).toEqual(DEFAULT_LLM_SETTINGS);
  });

  it("parses valid settings", () => {
    const parsed = parseLlmSettings({
      provider: "openrouter",
      apiKey: "sk-test",
      baseUrl: "https://openrouter.ai/api/v1/",
      model: "anthropic/claude-3.5-sonnet",
      timeoutMs: 30_000,
    });
    expect(parsed.provider).toBe("openrouter");
    expect(parsed.apiKey).toBe("sk-test");
    expect(parsed.baseUrl).toBe("https://openrouter.ai/api/v1");
    expect(parsed.model).toBe("anthropic/claude-3.5-sonnet");
    expect(parsed.timeoutMs).toBe(30_000);
  });

  it("clamps timeout", () => {
    expect(parseLlmSettings({ timeoutMs: 1_000 }).timeoutMs).toBe(5_000);
    expect(parseLlmSettings({ timeoutMs: 999_999 }).timeoutMs).toBe(300_000);
  });

  it("falls back to provider defaults for missing baseUrl and model", () => {
    const parsed = parseLlmSettings({ provider: "ollama" });
    expect(parsed.baseUrl).toBe("http://127.0.0.1:11434/v1");
    expect(parsed.model).toBe("llama3.2");
  });
});

describe("clampLlmTimeoutMs", () => {
  it("clamps to valid range", () => {
    expect(clampLlmTimeoutMs(1)).toBe(5_000);
    expect(clampLlmTimeoutMs(60_000)).toBe(60_000);
    expect(clampLlmTimeoutMs(Number.NaN)).toBe(60_000);
  });
});

describe("withLlmProvider", () => {
  it("updates defaults when switching provider", () => {
    const next = withLlmProvider(DEFAULT_LLM_SETTINGS, "ollama");
    expect(next.provider).toBe("ollama");
    expect(next.baseUrl).toBe("http://127.0.0.1:11434/v1");
    expect(next.model).toBe("llama3.2");
    expect(next.apiKey).toBe("");
  });

  it("preserves custom baseUrl when switching provider", () => {
    const custom = { ...DEFAULT_LLM_SETTINGS, baseUrl: "https://custom.example/v1" };
    const next = withLlmProvider(custom, "openrouter");
    expect(next.baseUrl).toBe("https://custom.example/v1");
  });
});
