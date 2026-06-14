import type { LlmSettings } from "@/domain/llm/LlmSettings";

export interface ILlmSettingsRepository {
  load(): unknown | null;
  save(settings: LlmSettings): void;
}
