import { parseLlmSettingsStore, type LlmSettingsStore } from "@/domain/llm/LlmSettings";
import type { ILlmSettingsRepository } from "../ports/ILlmSettingsRepository";

export function loadLlmSettings(repository: ILlmSettingsRepository): LlmSettingsStore {
  const raw = repository.load();
  if (raw === null) {
    return parseLlmSettingsStore(null);
  }
  return parseLlmSettingsStore(raw);
}
