import type { LlmSettingsStore } from "@/domain/llm/LlmSettings";

export interface ILlmSettingsRepository {
  load(softwareDataPath: string): Promise<unknown | null>;
  save(softwareDataPath: string, settings: LlmSettingsStore): Promise<void>;
}
