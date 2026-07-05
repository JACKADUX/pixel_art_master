import type { ColorEditPreferences } from "@/domain/colorEdit/ColorEditPreferences";

export interface IColorEditPreferencesRepository {
  load(softwareDataPath: string): Promise<unknown | null>;
  save(softwareDataPath: string, prefs: ColorEditPreferences): Promise<void>;
}
