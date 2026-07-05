import type { LlmSettingsStore } from "@/domain/llm/LlmSettings";
import type { ILlmSettingsRepository } from "../ports/ILlmSettingsRepository";

export async function saveLlmSettings(
  repository: ILlmSettingsRepository,
  softwareDataPath: string,
  settings: LlmSettingsStore,
): Promise<void> {
  await repository.save(softwareDataPath, settings);
}
