/** 可选的 DeepSeek 模型（OpenAI 兼容端点下通过 model 字段切换） */
export type DeepSeekModel = "deepseek-v4-flash" | "deepseek-v4-pro";

export const DEEPSEEK_MODELS: DeepSeekModel[] = ["deepseek-v4-flash", "deepseek-v4-pro"];

/** 各模型的中文标签与说明 */
export const DEEPSEEK_MODEL_LABELS: Record<DeepSeekModel, string> = {
  "deepseek-v4-flash": "deepseek-v4-flash（Flash · 速度优先）",
  "deepseek-v4-pro": "deepseek-v4-pro（Pro · 能力优先）",
};

/** 思考程度 */
export type ThinkingEffort = "low" | "medium" | "high";

export const THINKING_EFFORTS: ThinkingEffort[] = ["low", "medium", "high"];

export const THINKING_EFFORT_LABELS: Record<ThinkingEffort, string> = {
  low: "低",
  medium: "中",
  high: "高",
};

/**
 * 世界创建器中独立的 Agent（DeepSeek）参数设置。
 * 注意：API Key 不在此处，发起请求时从全局设置(Settings → AI)中读取。
 */
export interface WorldAgentSettings {
  model: DeepSeekModel;
  temperature: number;
  topP: number;
  maxTokens: number;
  thinkingEnabled: boolean;
  thinkingEffort: ThinkingEffort;
}

export const WORLD_AGENT_SETTINGS_VERSION = 1;

export const DEFAULT_WORLD_AGENT_SETTINGS: WorldAgentSettings = {
  model: "deepseek-v4-flash",
  temperature: 1,
  topP: 1,
  maxTokens: 4096,
  thinkingEnabled: false,
  thinkingEffort: "medium",
};

export const TEMPERATURE_MIN = 0;
export const TEMPERATURE_MAX = 2;
export const TOP_P_MIN = 0;
export const TOP_P_MAX = 1;
export const MAX_TOKENS_MIN = 256;
export const MAX_TOKENS_MAX = 8192;

function clampNumber(value: number, min: number, max: number, fallback: number): number {
  if (!Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, value));
}

export function clampTemperature(value: number): number {
  return clampNumber(value, TEMPERATURE_MIN, TEMPERATURE_MAX, DEFAULT_WORLD_AGENT_SETTINGS.temperature);
}

export function clampTopP(value: number): number {
  return clampNumber(value, TOP_P_MIN, TOP_P_MAX, DEFAULT_WORLD_AGENT_SETTINGS.topP);
}

export function clampMaxTokens(value: number): number {
  return Math.round(clampNumber(value, MAX_TOKENS_MIN, MAX_TOKENS_MAX, DEFAULT_WORLD_AGENT_SETTINGS.maxTokens));
}

export function parseDeepSeekModel(value: unknown): DeepSeekModel {
  return DEEPSEEK_MODELS.includes(value as DeepSeekModel)
    ? (value as DeepSeekModel)
    : DEFAULT_WORLD_AGENT_SETTINGS.model;
}

export function parseThinkingEffort(value: unknown): ThinkingEffort {
  return THINKING_EFFORTS.includes(value as ThinkingEffort)
    ? (value as ThinkingEffort)
    : DEFAULT_WORLD_AGENT_SETTINGS.thinkingEffort;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function parseWorldAgentSettings(raw: unknown): WorldAgentSettings {
  const defaults = DEFAULT_WORLD_AGENT_SETTINGS;
  if (!isRecord(raw)) return { ...defaults };

  return {
    model: parseDeepSeekModel(raw.model),
    temperature: clampTemperature(
      typeof raw.temperature === "number" ? raw.temperature : defaults.temperature,
    ),
    topP: clampTopP(typeof raw.topP === "number" ? raw.topP : defaults.topP),
    maxTokens: clampMaxTokens(
      typeof raw.maxTokens === "number" ? raw.maxTokens : defaults.maxTokens,
    ),
    thinkingEnabled:
      typeof raw.thinkingEnabled === "boolean" ? raw.thinkingEnabled : defaults.thinkingEnabled,
    thinkingEffort: parseThinkingEffort(raw.thinkingEffort),
  };
}

/** 温度 / Top-p 的快捷预设（点击直接套用一组实战搭配） */
export interface GenerationPreset {
  id: string;
  label: string;
  description: string;
  temperature: number;
  topP: number;
}

export const GENERATION_PRESETS: GenerationPreset[] = [
  {
    id: "precise",
    label: "精确严谨",
    description: "事实问答、代码、翻译、数学推理：确定性高、保守可靠",
    temperature: 0.2,
    topP: 0.3,
  },
  {
    id: "assistant",
    label: "日常助手",
    description: "通用对话、摘要、邮件：流畅自然、不易跑题",
    temperature: 0.7,
    topP: 0.9,
  },
  {
    id: "creative",
    label: "创意写作",
    description: "小说、诗歌、文案：用词丰富、富有灵感",
    temperature: 1,
    topP: 0.95,
  },
  {
    id: "brainstorm",
    label: "头脑风暴",
    description: "灵感发散、角色扮演：多样性最大、需人工筛选",
    temperature: 1.2,
    topP: 0.98,
  },
];

/** 判断当前温度/Top-p 是否与某个预设一致 */
export function matchGenerationPreset(temperature: number, topP: number): string | null {
  const match = GENERATION_PRESETS.find(
    (preset) => preset.temperature === temperature && preset.topP === topP,
  );
  return match?.id ?? null;
}

export function extractWorldAgentSettings(source: WorldAgentSettings): WorldAgentSettings {
  return {
    model: parseDeepSeekModel(source.model),
    temperature: clampTemperature(source.temperature),
    topP: clampTopP(source.topP),
    maxTokens: clampMaxTokens(source.maxTokens),
    thinkingEnabled: source.thinkingEnabled,
    thinkingEffort: parseThinkingEffort(source.thinkingEffort),
  };
}
