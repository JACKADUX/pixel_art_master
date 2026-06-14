import type { ColorEditPreferences } from "@/domain/colorEdit/ColorEditPreferences";

export interface IColorEditPreferencesRepository {
  load(): unknown | null;
  save(prefs: ColorEditPreferences): void;
}
