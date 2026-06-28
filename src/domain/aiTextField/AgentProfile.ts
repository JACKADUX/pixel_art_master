import type { ThinkingEffort } from "../llm/GenerationOptions";

export interface AgentProfile {
  id: string;
  name: string;
  systemPrompt: string;
  model?: string; // 覆盖全局模型，可选
  temperature: number;
  topP: number;
  maxTokens: number;
  thinkingEnabled: boolean;
  thinkingEffort: ThinkingEffort;
  isBuiltIn?: boolean;
}

export const TEMPERATURE_MIN = 0;
export const TEMPERATURE_MAX = 2;
export const TOP_P_MIN = 0;
export const TOP_P_MAX = 1;
export const MAX_TOKENS_MIN = 256;
export const MAX_TOKENS_MAX = 8192;

export const DEFAULT_AGENT_PROFILE: Omit<AgentProfile, "id" | "name" | "systemPrompt"> = {
  temperature: 0.7,
  topP: 0.9,
  maxTokens: 2048,
  thinkingEnabled: false,
  thinkingEffort: "medium",
};

export function clampNumber(value: number, min: number, max: number, fallback: number): number {
  if (!Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, value));
}

export function clampTemperature(value: number): number {
  return clampNumber(value, TEMPERATURE_MIN, TEMPERATURE_MAX, DEFAULT_AGENT_PROFILE.temperature);
}

export function clampTopP(value: number): number {
  return clampNumber(value, TOP_P_MIN, TOP_P_MAX, DEFAULT_AGENT_PROFILE.topP);
}

export function clampMaxTokens(value: number): number {
  return Math.round(clampNumber(value, MAX_TOKENS_MIN, MAX_TOKENS_MAX, DEFAULT_AGENT_PROFILE.maxTokens));
}

export const BUILT_IN_AGENT_PROFILES: AgentProfile[] = [
  {
    id: "expand",
    name: "扩写专家",
    systemPrompt: "你是一个文学创作与设定扩写专家。请根据用户提供的简短词汇、大纲或片段，进行合理、生动且富有细节的扩写。保持原意，但增加感官描写、环境氛围、心理活动或背景深度，使内容更加丰满。",
    temperature: 0.8,
    topP: 0.9,
    maxTokens: 2048,
    thinkingEnabled: false,
    thinkingEffort: "medium",
    isBuiltIn: true,
  },
  {
    id: "polish",
    name: "文本润色",
    systemPrompt: "你是一个专业的文字编辑与润色助手。请对用户输入的文本进行润色，优化词汇选择、句式结构和段落流畅度，纠正错别字和语病。在不改变原意的前提下，提升整体的文学性、专业性或表现力。请直接输出润色后的内容。",
    temperature: 0.4,
    topP: 0.8,
    maxTokens: 2048,
    thinkingEnabled: false,
    thinkingEffort: "medium",
    isBuiltIn: true,
  },
  {
    id: "naming",
    name: "创意起名",
    systemPrompt: "你是一个创意命名大师。请根据用户提供的背景设定、特征描述或世界观，提供一批富有创意、符合基调、朗朗上口的名字（如角色名、地点名、道具名、势力名等）。请给出名字并附带简短的寓意解释。",
    temperature: 1.0,
    topP: 0.95,
    maxTokens: 1024,
    thinkingEnabled: false,
    thinkingEffort: "medium",
    isBuiltIn: true,
  },
  {
    id: "summarize",
    name: "内容总结",
    systemPrompt: "你是一个高效的信息提炼助手。请对用户提供的长文本进行提炼，生成一段简明扼要的概要或核心要点。过滤掉冗余信息，保留最核心的设定、事件或特征。",
    temperature: 0.3,
    topP: 0.7,
    maxTokens: 1024,
    thinkingEnabled: false,
    thinkingEffort: "medium",
    isBuiltIn: true,
  },
  {
    id: "continue",
    name: "故事续写",
    systemPrompt: "你是一个小说与故事续写助手。请根据用户给出的前文或大纲，顺着既有的情节逻辑、角色性格和世界观设定，进行精彩的续写。保持文风一致，制造合理的悬念或转折，推动剧情发展。",
    temperature: 0.9,
    topP: 0.9,
    maxTokens: 2048,
    thinkingEnabled: false,
    thinkingEffort: "medium",
    isBuiltIn: true,
  }
];

export type AgentProfileParams = Pick<
  AgentProfile,
  "temperature" | "topP" | "maxTokens" | "thinkingEnabled" | "thinkingEffort"
>;

export const AGENT_THINKING_EFFORT_LABELS: Record<ThinkingEffort, string> = {
  low: "低",
  medium: "中",
  high: "高",
};

export function getBuiltInAgentProfile(id: string): AgentProfile | undefined {
  return BUILT_IN_AGENT_PROFILES.find((profile) => profile.id === id);
}

export function extractAgentProfileParams(profile: AgentProfileParams): AgentProfileParams {
  return {
    temperature: clampTemperature(profile.temperature),
    topP: clampTopP(profile.topP),
    maxTokens: clampMaxTokens(profile.maxTokens),
    thinkingEnabled: profile.thinkingEnabled,
    thinkingEffort: profile.thinkingEffort,
  };
}

export function areAgentProfileParamsEqual(a: AgentProfileParams, b: AgentProfileParams): boolean {
  return (
    a.temperature === b.temperature &&
    a.topP === b.topP &&
    a.maxTokens === b.maxTokens &&
    a.thinkingEnabled === b.thinkingEnabled &&
    a.thinkingEffort === b.thinkingEffort
  );
}

export function formatAgentProfileParamsSummary(params: AgentProfileParams): string {
  const thinking = params.thinkingEnabled
    ? `思考${AGENT_THINKING_EFFORT_LABELS[params.thinkingEffort]}`
    : "思考关";
  return `Temp ${params.temperature} · TopP ${params.topP} · ${params.maxTokens} tokens · ${thinking}`;
}

export function parseAgentProfile(raw: unknown): AgentProfile {
  const defaults = {
    id: "",
    name: "未命名 Agent",
    systemPrompt: "",
    ...DEFAULT_AGENT_PROFILE,
  };

  if (typeof raw !== "object" || raw === null) {
    return { ...defaults, id: crypto.randomUUID() };
  }

  const r = raw as Record<string, any>;
  return {
    id: typeof r.id === "string" && r.id ? r.id : crypto.randomUUID(),
    name: typeof r.name === "string" && r.name ? r.name : defaults.name,
    systemPrompt: typeof r.systemPrompt === "string" ? r.systemPrompt : defaults.systemPrompt,
    model: typeof r.model === "string" && r.model ? r.model : undefined,
    temperature: clampTemperature(typeof r.temperature === "number" ? r.temperature : defaults.temperature),
    topP: clampTopP(typeof r.topP === "number" ? r.topP : defaults.topP),
    maxTokens: clampMaxTokens(typeof r.maxTokens === "number" ? r.maxTokens : defaults.maxTokens),
    thinkingEnabled: typeof r.thinkingEnabled === "boolean" ? r.thinkingEnabled : defaults.thinkingEnabled,
    thinkingEffort: (r.thinkingEffort === "low" || r.thinkingEffort === "medium" || r.thinkingEffort === "high")
      ? r.thinkingEffort
      : defaults.thinkingEffort,
    isBuiltIn: typeof r.isBuiltIn === "boolean" ? r.isBuiltIn : undefined,
  };
}
