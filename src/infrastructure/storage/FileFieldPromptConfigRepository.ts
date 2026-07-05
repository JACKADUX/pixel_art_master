import type { IFieldPromptConfigRepository } from "@/application/ports/IFieldPromptConfigRepository";
import type { FieldPromptConfig } from "@/domain/aiTextField/FieldPromptConfig";
import { buildFieldPromptConfigsPath } from "@/domain/softwareDataPath/UserDataPaths";
import {
  readUserDataJson,
  writeUserDataJson,
} from "@/infrastructure/storage/FileUserDataHelper";

const VERSION = 1;

interface SerializedFieldPromptConfigs {
  version: number;
  configs: Record<string, FieldPromptConfig>;
}

export class FileFieldPromptConfigRepository implements IFieldPromptConfigRepository {
  async loadAll(softwareDataPath: string): Promise<unknown | null> {
    const parsed = await readUserDataJson(buildFieldPromptConfigsPath(softwareDataPath));
    if (typeof parsed !== "object" || parsed === null) return null;

    const version = (parsed as SerializedFieldPromptConfigs).version;
    if (version !== VERSION) {
      return null;
    }

    return (parsed as SerializedFieldPromptConfigs).configs;
  }

  async saveAll(
    softwareDataPath: string,
    configs: Record<string, FieldPromptConfig>,
  ): Promise<void> {
    const payload: SerializedFieldPromptConfigs = {
      version: VERSION,
      configs,
    };
    await writeUserDataJson(
      softwareDataPath,
      buildFieldPromptConfigsPath(softwareDataPath),
      payload,
    );
  }
}

export const fieldPromptConfigRepository = new FileFieldPromptConfigRepository();
