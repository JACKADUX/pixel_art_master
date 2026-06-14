import { parseLlmSettings, type LlmSettings } from "@/domain/llm/LlmSettings";
import type { ILlmSettingsRepository } from "../ports/ILlmSettingsRepository";

export function loadLlmSettings(repository: ILlmSettingsRepository): LlmSettings {
  const raw = repository.load();
  if (raw === null) {
    return parseLlmSettings(null);
  }
  return parseLlmSettings(raw);
}
