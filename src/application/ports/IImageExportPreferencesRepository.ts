import type { ImageExportPreferences } from "@/domain/export/ImageExportPreferences";

export interface IImageExportPreferencesRepository {
  load(): unknown | null;
  save(prefs: ImageExportPreferences): void;
}
