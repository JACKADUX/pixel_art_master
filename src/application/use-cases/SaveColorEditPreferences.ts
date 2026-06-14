import type { ColorEditPreferences } from "@/domain/colorEdit/ColorEditPreferences";
import type { IColorEditPreferencesRepository } from "../ports/IColorEditPreferencesRepository";

export function saveColorEditPreferences(
  repository: IColorEditPreferencesRepository,
  prefs: ColorEditPreferences,
): void {
  repository.save(prefs);
}
