import { describe, expect, it } from "vitest";
import { createPromptItem, mergePromptValue, type PromptItem } from "./PromptComponent";

function item(text: string, disabled = false): PromptItem {
  return { id: text, text, disabled };
}

describe("mergePromptValue", () => {
  it("把启用提示词以逗号追加到输入框内容末尾，保持顺序", () => {
    const result = mergePromptValue("基础内容", [item("masterpiece"), item("best quality")]);
    expect(result).toBe("基础内容, masterpiece, best quality");
  });

  it("过滤禁用项与空白文本", () => {
    const result = mergePromptValue("base", [
      item("keep"),
      item("skip", true),
      item("   "),
    ]);
    expect(result).toBe("base, keep");
  });

  it("输入框为空时不前置分隔符", () => {
    expect(mergePromptValue("", [item("alpha"), item("beta")])).toBe("alpha, beta");
  });

  it("输入框含首尾空白时会被修剪", () => {
    expect(mergePromptValue("  base  ", [item("alpha")])).toBe("base, alpha");
  });

  it("无任何启用提示词时返回输入框内容", () => {
    expect(mergePromptValue("only base", [item("x", true)])).toBe("only base");
  });

  it("全部为空返回空字符串", () => {
    expect(mergePromptValue("   ", [])).toBe("");
  });
});

describe("createPromptItem", () => {
  it("创建启用状态并修剪文本", () => {
    const created = createPromptItem("  hello  ");
    expect(created.text).toBe("hello");
    expect(created.disabled).toBe(false);
    expect(created.id).toBeTruthy();
  });
});
