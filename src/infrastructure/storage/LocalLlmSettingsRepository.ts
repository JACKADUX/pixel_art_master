import type { ILlmSettingsRepository } from "@/application/ports/ILlmSettingsRepository";
import { LLM_SETTINGS_VERSION, type LlmSettingsStore } from "@/domain/llm/LlmSettings";

const STORAGE_KEY = "pixelart.llm.settings";

interface SerializedLlmSettingsStore extends LlmSettingsStore {
  version: number;
}

export class LocalLlmSettingsRepository implements ILlmSettingsRepository {
  load(): unknown | null {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return null;

      const parsed: unknown = JSON.parse(stored);
      if (typeof parsed !== "object" || parsed === null) return null;

      const version = (parsed as SerializedLlmSettingsStore).version;
      if (version !== 1 && version !== 2) return null;

      return parsed;
    } catch {
      return null;
    }
  }

  save(settings: LlmSettingsStore): void {
    try {
      const payload: SerializedLlmSettingsStore = {
        version: LLM_SETTINGS_VERSION,
        ...settings,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // Ignore quota or privacy-mode failures.
    }
  }
}

export const llmSettingsRepository = new LocalLlmSettingsRepository();
