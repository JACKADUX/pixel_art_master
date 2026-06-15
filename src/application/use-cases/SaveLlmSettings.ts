import type { LlmSettingsStore } from "@/domain/llm/LlmSettings";
import type { ILlmSettingsRepository } from "../ports/ILlmSettingsRepository";

export function saveLlmSettings(
  repository: ILlmSettingsRepository,
  settings: LlmSettingsStore,
): void {
  repository.save(settings);
}
