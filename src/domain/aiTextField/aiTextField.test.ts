import { describe, expect, it } from "vitest";
import {
  clampTemperature,
  clampTopP,
  clampMaxTokens,
  parseAgentProfile,
  areAgentProfileParamsEqual,
  formatAgentProfileParamsSummary,
  getBuiltInAgentProfile,
} from "./AgentProfile";
import {
  renderPromptTemplate,
  extractReferencedFields,
} from "./PromptTemplate";
import {
  getFallbackFieldPromptConfig,
  parseFieldPromptConfig,
} from "./FieldPromptConfig";

describe("AgentProfile", () => {
  it("clamps numeric ranges correctly", () => {
    expect(clampTemperature(3)).toBe(2);
    expect(clampTemperature(-0.5)).toBe(0);
    expect(clampTopP(1.5)).toBe(1);
    expect(clampTopP(-0.1)).toBe(0);
    expect(clampMaxTokens(10000)).toBe(8192);
    expect(clampMaxTokens(100)).toBe(256);
  });

  it("parses valid agent profiles", () => {
    const raw = {
      id: "test-agent",
      name: "测试 Agent",
      systemPrompt: "你是一个测试助手",
      temperature: 0.5,
      topP: 0.8,
      maxTokens: 1024,
      thinkingEnabled: true,
      thinkingEffort: "high",
    };
    const parsed = parseAgentProfile(raw);
    expect(parsed).toEqual({
      ...raw,
      isBuiltIn: undefined,
    });
  });

  it("falls back to defaults for invalid raw data", () => {
    const parsed = parseAgentProfile(null);
    expect(parsed.id).toBeDefined();
    expect(parsed.name).toBe("未命名 Agent");
    expect(parsed.temperature).toBe(0.7);
    expect(parsed.thinkingEffort).toBe("medium");
  });

  it("compares agent profile params", () => {
    const a = { temperature: 0.8, topP: 0.9, maxTokens: 2048, thinkingEnabled: false, thinkingEffort: "medium" as const };
    const b = { ...a };
    expect(areAgentProfileParamsEqual(a, b)).toBe(true);
    expect(areAgentProfileParamsEqual(a, { ...a, temperature: 1 })).toBe(false);
  });

  it("formats params summary for display", () => {
    const summary = formatAgentProfileParamsSummary({
      temperature: 0.8,
      topP: 0.9,
      maxTokens: 2048,
      thinkingEnabled: true,
      thinkingEffort: "high",
    });
    expect(summary).toContain("Temp 0.8");
    expect(summary).toContain("思考高");
  });

  it("gets built-in profile by id", () => {
    const expand = getBuiltInAgentProfile("expand");
    expect(expand?.name).toBe("扩写专家");
    expect(getBuiltInAgentProfile("missing")).toBeUndefined();
  });
});

describe("PromptTemplate", () => {
  it("renders templates correctly with self and field placeholders", () => {
    const template = "你好，我是{{self}}。我的朋友是{{field:friend.name}}，他住在{{field:friend.city}}。";
    const resolver = (fieldId: string) => {
      if (fieldId === "friend.name") return "张三";
      if (fieldId === "friend.city") return "北京";
      return "";
    };
    const rendered = renderPromptTemplate(template, "李四", resolver);
    expect(rendered).toBe("你好，我是李四。我的朋友是张三，他住在北京。");
  });

  it("extracts referenced fields correctly", () => {
    const template = "你好，我是{{self}}。我的朋友是{{field:friend.name}}，他住在{{field:friend.city}}。";
    const fields = extractReferencedFields(template);
    expect(fields).toEqual(["friend.name", "friend.city"]);
  });
});

describe("FieldPromptConfig", () => {
  it("gets fallback configs for known fieldIds", () => {
    const config = getFallbackFieldPromptConfig("world.worldview");
    expect(config.fieldId).toBe("world.worldview");
    expect(config.agentProfileId).toBe("expand");
    expect(config.promptTemplate).toContain("{{self}}");
  });

  it("parses field prompt config with fallback", () => {
    const raw = {
      agentProfileId: "polish",
      promptTemplate: "润色：{{self}}",
    };
    const parsed = parseFieldPromptConfig(raw, "world.worldview");
    expect(parsed).toEqual({
      fieldId: "world.worldview",
      agentProfileId: "polish",
      promptTemplate: "润色：{{self}}",
    });
  });
});
