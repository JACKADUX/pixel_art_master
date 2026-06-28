import type { IPromptPresetRepository } from "@/application/ports/IPromptPresetRepository";
import {
  PROMPT_PRESET_LIBRARY_VERSION,
  type PromptPresetLibrary,
} from "@/domain/comfyApp/PromptPresetLibrary";

const STORAGE_KEY = "pixelart-comfy-prompt-presets";

function serializeLibrary(library: PromptPresetLibrary) {
  return {
    version: PROMPT_PRESET_LIBRARY_VERSION,
    presets: library.presets.map((preset) => ({
      id: preset.id,
      name: preset.name,
      prompts: [...preset.prompts],
      createdAt: preset.createdAt,
      updatedAt: preset.updatedAt,
    })),
  };
}

export class LocalPromptPresetRepository implements IPromptPresetRepository {
  load(): unknown | null {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return null;
      return JSON.parse(stored) as unknown;
    } catch {
      return null;
    }
  }

  save(library: PromptPresetLibrary): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(serializeLibrary(library)));
    } catch {
      // Ignore quota or privacy-mode failures.
    }
  }
}

export const promptPresetRepository = new LocalPromptPresetRepository();
