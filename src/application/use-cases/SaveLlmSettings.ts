import type { LlmSettings } from "@/domain/llm/LlmSettings";
import type { ILlmSettingsRepository } from "../ports/ILlmSettingsRepository";

export function saveLlmSettings(
  repository: ILlmSettingsRepository,
  settings: LlmSettings,
): void {
  repository.save(settings);
}
