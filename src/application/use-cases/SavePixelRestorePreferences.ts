import type { PixelRestorePreferences } from "@/domain/pixelRestore/PixelRestorePreferences";
import type { IPixelRestorePreferencesRepository } from "../ports/IPixelRestorePreferencesRepository";

export async function savePixelRestorePreferences(
  repository: IPixelRestorePreferencesRepository,
  softwareDataPath: string,
  prefs: PixelRestorePreferences,
): Promise<void> {
  await repository.save(softwareDataPath, prefs);
}
