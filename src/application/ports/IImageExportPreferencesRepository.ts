import type { ImageExportPreferences } from "@/domain/export/ImageExportPreferences";

export interface IImageExportPreferencesRepository {
  load(softwareDataPath: string): Promise<unknown | null>;
  save(softwareDataPath: string, prefs: ImageExportPreferences): Promise<void>;
}
