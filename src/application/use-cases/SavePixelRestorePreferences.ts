import type { PixelRestorePreferences } from "@/domain/pixelRestore/PixelRestorePreferences";
import type { IPixelRestorePreferencesRepository } from "../ports/IPixelRestorePreferencesRepository";

export function savePixelRestorePreferences(
  repository: IPixelRestorePreferencesRepository,
  prefs: PixelRestorePreferences,
): void {
  repository.save(prefs);
}
