import { describe, expect, it } from "vitest";
import {
  DEFAULT_WORLD_AGENT_SETTINGS,
  clampMaxTokens,
  clampTemperature,
  clampTopP,
  extractWorldAgentSettings,
  parseWorldAgentSettings,
} from "./WorldAgentSettings";

describe("WorldAgentSettings", () => {
  it("returns defaults for invalid input", () => {
    expect(parseWorldAgentSettings(null)).toEqual(DEFAULT_WORLD_AGENT_SETTINGS);
    expect(parseWorldAgentSettings("x")).toEqual(DEFAULT_WORLD_AGENT_SETTINGS);
  });

  it("clamps numeric ranges", () => {
    expect(clampTemperature(5)).toBe(2);
    expect(clampTemperature(-1)).toBe(0);
    expect(clampTopP(2)).toBe(1);
    expect(clampMaxTokens(99999)).toBe(8192);
    expect(clampMaxTokens(10)).toBe(256);
    expect(clampMaxTokens(1000.6)).toBe(1001);
  });

  it("falls back invalid enums to defaults", () => {
    const parsed = parseWorldAgentSettings({ model: "gpt-4", thinkingEffort: "ultra" });
    expect(parsed.model).toBe("deepseek-v4-flash");
    expect(parsed.thinkingEffort).toBe("medium");
  });

  it("parses stored settings", () => {
    const stored = {
      model: "deepseek-v4-pro",
      temperature: 0.7,
      topP: 0.9,
      maxTokens: 2048,
      thinkingEnabled: true,
      thinkingEffort: "high",
    };
    expect(parseWorldAgentSettings(stored)).toEqual(stored);
  });

  it("extracts and normalizes a settings object", () => {
    const result = extractWorldAgentSettings({
      model: "deepseek-v4-pro",
      temperature: 9,
      topP: -1,
      maxTokens: 1_000_000,
      thinkingEnabled: true,
      thinkingEffort: "low",
    });
    expect(result.temperature).toBe(2);
    expect(result.topP).toBe(0);
    expect(result.maxTokens).toBe(8192);
  });
});
