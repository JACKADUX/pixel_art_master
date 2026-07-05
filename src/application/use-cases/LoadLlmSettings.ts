import { parseLlmSettingsStore, type LlmSettingsStore } from "@/domain/llm/LlmSettings";
import type { ILlmSettingsRepository } from "../ports/ILlmSettingsRepository";

export async function loadLlmSettings(
  repository: ILlmSettingsRepository,
  softwareDataPath: string,
): Promise<LlmSettingsStore> {
  const raw = await repository.load(softwareDataPath);
  if (raw === null) {
    return parseLlmSettingsStore(null);
  }
  return parseLlmSettingsStore(raw);
}
