import type { IFieldPromptConfigRepository } from "@/application/ports/IFieldPromptConfigRepository";
import type { FieldPromptConfig } from "@/domain/aiTextField/FieldPromptConfig";

const STORAGE_KEY = "pixelart.aiTextField.fieldPromptConfigs";
const VERSION = 1;

interface SerializedFieldPromptConfigs {
  version: number;
  configs: Record<string, FieldPromptConfig>;
}

export class LocalFieldPromptConfigRepository implements IFieldPromptConfigRepository {
  loadAll(): unknown | null {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return null;

      const parsed: unknown = JSON.parse(stored);
      if (typeof parsed !== "object" || parsed === null) return null;

      const version = (parsed as SerializedFieldPromptConfigs).version;
      if (version !== VERSION) {
        return null;
      }

      return (parsed as SerializedFieldPromptConfigs).configs;
    } catch {
      return null;
    }
  }

  saveAll(configs: Record<string, FieldPromptConfig>): void {
    try {
      const payload: SerializedFieldPromptConfigs = {
        version: VERSION,
        configs,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // Ignore
    }
  }
}

export const fieldPromptConfigRepository = new LocalFieldPromptConfigRepository();
