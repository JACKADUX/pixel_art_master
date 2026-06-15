import type { LlmSettingsStore } from "@/domain/llm/LlmSettings";

export interface ILlmSettingsRepository {
  load(): unknown | null;
  save(settings: LlmSettingsStore): void;
}
