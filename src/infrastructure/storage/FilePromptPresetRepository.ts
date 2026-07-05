import type { IPromptPresetRepository } from "@/application/ports/IPromptPresetRepository";
import {
  PROMPT_PRESET_LIBRARY_VERSION,
  type PromptPresetLibrary,
} from "@/domain/comfyApp/PromptPresetLibrary";
import { buildComfyPromptPresetsPath } from "@/domain/softwareDataPath/UserDataPaths";
import {
  readUserDataJson,
  writeUserDataJson,
} from "@/infrastructure/storage/FileUserDataHelper";

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

export class FilePromptPresetRepository implements IPromptPresetRepository {
  async load(softwareDataPath: string): Promise<unknown | null> {
    return readUserDataJson(buildComfyPromptPresetsPath(softwareDataPath));
  }

  async save(softwareDataPath: string, library: PromptPresetLibrary): Promise<void> {
    await writeUserDataJson(
      softwareDataPath,
      buildComfyPromptPresetsPath(softwareDataPath),
      serializeLibrary(library),
    );
  }
}

export const promptPresetRepository = new FilePromptPresetRepository();
