import type { ColorEditPreferences } from "@/domain/colorEdit/ColorEditPreferences";
import type { IColorEditPreferencesRepository } from "../ports/IColorEditPreferencesRepository";

export async function saveColorEditPreferences(
  repository: IColorEditPreferencesRepository,
  softwareDataPath: string,
  prefs: ColorEditPreferences,
): Promise<void> {
  await repository.save(softwareDataPath, prefs);
}
