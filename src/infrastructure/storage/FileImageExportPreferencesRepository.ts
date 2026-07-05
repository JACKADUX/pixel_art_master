import type { IImageExportPreferencesRepository } from "@/application/ports/IImageExportPreferencesRepository";
import {
  IMAGE_EXPORT_PREFERENCES_VERSION,
  parseImageExportPreferences,
  type ImageExportPreferences,
} from "@/domain/export/ImageExportPreferences";
import { buildImageExportPreferencesPath } from "@/domain/softwareDataPath/UserDataPaths";
import {
  readUserDataJson,
  writeUserDataJson,
} from "@/infrastructure/storage/FileUserDataHelper";

interface SerializedImageExportPreferences extends ImageExportPreferences {
  version: typeof IMAGE_EXPORT_PREFERENCES_VERSION;
}

export class FileImageExportPreferencesRepository implements IImageExportPreferencesRepository {
  async load(softwareDataPath: string): Promise<unknown | null> {
    const parsed = await readUserDataJson(buildImageExportPreferencesPath(softwareDataPath));
    if (typeof parsed !== "object" || parsed === null) return null;

    const version = (parsed as SerializedImageExportPreferences).version;
    if (version !== IMAGE_EXPORT_PREFERENCES_VERSION) return null;

    return parsed;
  }

  async save(softwareDataPath: string, prefs: ImageExportPreferences): Promise<void> {
    const payload: SerializedImageExportPreferences = {
      version: IMAGE_EXPORT_PREFERENCES_VERSION,
      ...prefs,
    };
    await writeUserDataJson(
      softwareDataPath,
      buildImageExportPreferencesPath(softwareDataPath),
      payload,
    );
  }
}

export const imageExportPreferencesRepository = new FileImageExportPreferencesRepository();

export async function loadImageExportPreferences(
  softwareDataPath: string,
  repository: IImageExportPreferencesRepository = imageExportPreferencesRepository,
): Promise<ImageExportPreferences> {
  return parseImageExportPreferences(await repository.load(softwareDataPath));
}
