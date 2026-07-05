import type { IComfyUiSettingsRepository } from "@/application/ports/IComfyUiSettingsRepository";
import {
  createComfyServerConfig,
  type ComfyServerConfig,
} from "@/domain/comfyui/ComfyServerConfig";
import {
  buildComfyUiOutputTypesPath,
  buildComfyUiSettingsPath,
} from "@/domain/softwareDataPath/UserDataPaths";
import {
  readUserDataJson,
  writeUserDataJson,
} from "@/infrastructure/storage/FileUserDataHelper";

const VERSION = 1;

interface SerializedComfyUiSettings {
  version: number;
  address: string;
}

interface SerializedOutputClassTypes {
  version: number;
  types: string[];
}

export class FileComfyUiSettingsRepository implements IComfyUiSettingsRepository {
  async load(softwareDataPath: string): Promise<ComfyServerConfig | null> {
    const parsed = await readUserDataJson(buildComfyUiSettingsPath(softwareDataPath));
    if (typeof parsed !== "object" || parsed === null) return null;

    const address = (parsed as SerializedComfyUiSettings).address;
    if (typeof address !== "string") return null;

    return createComfyServerConfig(address);
  }

  async save(softwareDataPath: string, config: ComfyServerConfig): Promise<void> {
    const payload: SerializedComfyUiSettings = {
      version: VERSION,
      address: config.address,
    };
    await writeUserDataJson(
      softwareDataPath,
      buildComfyUiSettingsPath(softwareDataPath),
      payload,
    );
  }

  async loadOutputClassTypes(softwareDataPath: string): Promise<string[] | null> {
    const parsed = await readUserDataJson(buildComfyUiOutputTypesPath(softwareDataPath));
    if (typeof parsed !== "object" || parsed === null) return null;

    const types = (parsed as SerializedOutputClassTypes).types;
    if (!Array.isArray(types)) return null;

    return types.filter((item): item is string => typeof item === "string");
  }

  async saveOutputClassTypes(softwareDataPath: string, types: string[]): Promise<void> {
    const payload: SerializedOutputClassTypes = { version: VERSION, types };
    await writeUserDataJson(
      softwareDataPath,
      buildComfyUiOutputTypesPath(softwareDataPath),
      payload,
    );
  }
}

export const comfyUiSettingsRepository = new FileComfyUiSettingsRepository();
