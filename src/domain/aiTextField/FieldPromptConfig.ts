export interface FieldPromptConfig {
  fieldId: string;
  agentProfileId: string; // 默认关联的 Agent 档案 ID
  promptTemplate: string; // 预设的 prompt 模板
}

/**
 * 针对项目中不同 fieldId 的默认 Prompt 模板与预设 Agent
 */
export const DEFAULT_FIELD_PROMPT_CONFIGS: Record<string, Omit<FieldPromptConfig, "fieldId">> = {
  // 世界观描述
  "world.worldview": {
    agentProfileId: "expand",
    promptTemplate: "请帮我扩写并完善这个世界观设定。当前设想如下：\n{{self}}\n\n请使其更加宏大、逻辑自洽、富有想象力，涵盖核心法则、历史背景和基调。"
  },
  // 对象名称
  "world.entity.name": {
    agentProfileId: "naming",
    promptTemplate: "我正在创作一个世界，世界观设定如下：\n{{field:world.worldview}}\n\n请根据以下线索，为其中的一个对象起 5 个富有创意的名字，并附带简短的寓意：\n{{self}}"
  },
  // 对象概要
  "world.entity.summary": {
    agentProfileId: "polish",
    promptTemplate: "请为以下对象生成或润色一段简短的概要（100字以内），突出其最核心的特征和功能：\n对象名称：{{field:world.entity.name}}\n当前概要：{{self}}"
  },
  // 对象描述
  "world.entity.description": {
    agentProfileId: "expand",
    promptTemplate: "我正在创作一个世界，世界观设定如下：\n{{field:world.worldview}}\n\n请帮我详细描述以下对象：\n对象名称：{{field:world.entity.name}}\n对象概要：{{field:world.entity.summary}}\n当前描述：{{self}}\n\n请从外观、结构、功能以及在世界中的作用等方面进行生动、具体的扩写。"
  },
  // 对象背景故事
  "world.entity.backstory": {
    agentProfileId: "continue",
    promptTemplate: "我正在创作一个世界，世界观设定如下：\n{{field:world.worldview}}\n\n请为以下对象创作或续写背景故事：\n对象名称：{{field:world.entity.name}}\n对象描述：{{field:world.entity.description}}\n当前背景：{{self}}\n\n请让故事富有传奇色彩，融入世界观，展现其起源、经历或关键事件。"
  }
};

export function getFallbackFieldPromptConfig(fieldId: string): FieldPromptConfig {
  const matched = DEFAULT_FIELD_PROMPT_CONFIGS[fieldId];
  if (matched) {
    return {
      fieldId,
      agentProfileId: matched.agentProfileId,
      promptTemplate: matched.promptTemplate,
    };
  }

  // 通用兜底
  return {
    fieldId,
    agentProfileId: "expand",
    promptTemplate: "请根据以下内容进行扩写：\n{{self}}",
  };
}

export function parseFieldPromptConfig(raw: unknown, fieldId: string): FieldPromptConfig {
  const fallback = getFallbackFieldPromptConfig(fieldId);

  if (typeof raw !== "object" || raw === null) {
    return fallback;
  }

  const r = raw as Record<string, any>;
  return {
    fieldId,
    agentProfileId: typeof r.agentProfileId === "string" && r.agentProfileId ? r.agentProfileId : fallback.agentProfileId,
    promptTemplate: typeof r.promptTemplate === "string" ? r.promptTemplate : fallback.promptTemplate,
  };
}
