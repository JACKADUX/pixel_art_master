/** 提示词组件的领域纯函数：提示词标签项与合并逻辑 */

/**
 * 单个快捷提示词标签。
 * - text     : 提示词文本
 * - disabled : 禁用项仍在界面展示，但不计入最终合并结果
 */
export interface PromptItem {
  id: string;
  text: string;
  disabled: boolean;
}

/** 合并时各部分之间的分隔符 */
export const PROMPT_SEPARATOR = ", ";

function randomId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `prompt-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/** 由文本创建一个启用状态的提示词标签 */
export function createPromptItem(text: string): PromptItem {
  return { id: randomId(), text: text.trim(), disabled: false };
}

/**
 * 把启用的提示词追加到输入框内容末尾，逗号分隔。
 * 过滤掉禁用项与空白文本；输入框内容为空时不会前置分隔符。
 */
export function mergePromptValue(baseText: string, prompts: readonly PromptItem[]): string {
  const enabled = prompts
    .filter((item) => !item.disabled)
    .map((item) => item.text.trim())
    .filter((text) => text.length > 0);
  const parts = [baseText.trim(), ...enabled].filter((part) => part.length > 0);
  return parts.join(PROMPT_SEPARATOR);
}
