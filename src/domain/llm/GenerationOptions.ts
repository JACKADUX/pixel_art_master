export type ThinkingEffort = "low" | "medium" | "high";

export interface GenerationOptions {
  temperature?: number;
  topP?: number;
  maxTokens?: number;
  thinkingEnabled?: boolean;
  thinkingEffort?: ThinkingEffort;
}
