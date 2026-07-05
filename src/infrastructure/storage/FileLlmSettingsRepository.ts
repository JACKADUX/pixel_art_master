import type { ILlmSettingsRepository } from "@/application/ports/ILlmSettingsRepository";
import { LLM_SETTINGS_VERSION, type LlmSettingsStore } from "@/domain/llm/LlmSettings";
import { buildLlmSettingsPath } from "@/domain/softwareDataPath/UserDataPaths";
import {
  readUserDataJson,
  writeUserDataJson,
} from "@/infrastructure/storage/FileUserDataHelper";

interface SerializedLlmSettingsStore extends LlmSettingsStore {
  version: number;
}

export class FileLlmSettingsRepository implements ILlmSettingsRepository {
  async load(softwareDataPath: string): Promise<unknown | null> {
    const parsed = await readUserDataJson(buildLlmSettingsPath(softwareDataPath));
    if (typeof parsed !== "object" || parsed === null) return null;

    const version = (parsed as SerializedLlmSettingsStore).version;
    if (version !== 1 && version !== 2) return null;

    return parsed;
  }

  async save(softwareDataPath: string, settings: LlmSettingsStore): Promise<void> {
    const payload: SerializedLlmSettingsStore = {
      version: LLM_SETTINGS_VERSION,
      ...settings,
    };
    await writeUserDataJson(softwareDataPath, buildLlmSettingsPath(softwareDataPath), payload);
  }
}

export const llmSettingsRepository = new FileLlmSettingsRepository();
